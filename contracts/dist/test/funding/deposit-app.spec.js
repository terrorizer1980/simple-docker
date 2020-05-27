"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/utils");
const DepositApp_json_1 = __importDefault(require("../../build/DepositApp.json"));
const DelegateProxy_json_1 = __importDefault(require("../../build/DelegateProxy.json"));
const DolphinCoin_json_1 = __importDefault(require("../../build/DolphinCoin.json"));
const constants_1 = require("ethers/constants");
const utils_2 = require("../utils");
const MAX_INT = new utils_1.BigNumber(2).pow(256).sub(1);
const decodeTransfers = (encodedTransfers) => utils_1.defaultAbiCoder.decode([types_1.singleAssetTwoPartyCoinTransferEncoding], encodedTransfers)[0];
const encodeAppState = (state, onlyCoinTransfers = false) => {
    if (!onlyCoinTransfers) {
        return utils_1.defaultAbiCoder.encode([types_1.DepositAppStateEncoding], [state]);
    }
    return utils_1.defaultAbiCoder.encode([types_1.singleAssetTwoPartyCoinTransferEncoding], [state.transfers]);
};
describe("DepositApp", () => {
    let wallet;
    let depositApp;
    let proxy;
    let erc20;
    const depositorWallet = ethers_1.Wallet.createRandom();
    const counterpartyWallet = ethers_1.Wallet.createRandom();
    before(async () => {
        wallet = (await utils_2.provider.getWallets())[2];
        depositApp = await new ethers_1.ContractFactory(DepositApp_json_1.default.abi, DepositApp_json_1.default.bytecode, wallet).deploy();
        erc20 = await new ethers_1.ContractFactory(DolphinCoin_json_1.default.abi, DolphinCoin_json_1.default.bytecode, wallet).deploy();
        proxy = await new ethers_1.ContractFactory(DelegateProxy_json_1.default.abi, DelegateProxy_json_1.default.bytecode, wallet).deploy();
    });
    const computeOutcome = async (state) => {
        return depositApp.functions.computeOutcome(encodeAppState(state));
    };
    const createInitialState = async (assetId) => {
        return {
            transfers: [
                {
                    amount: constants_1.Zero,
                    to: depositorWallet.address,
                },
                {
                    amount: constants_1.Zero,
                    to: counterpartyWallet.address,
                },
            ],
            multisigAddress: proxy.address,
            assetId,
            startingTotalAmountWithdrawn: await getTotalAmountWithdrawn(assetId),
            startingMultisigBalance: await getMultisigBalance(assetId),
        };
    };
    const getMultisigBalance = async (assetId) => {
        return assetId === constants_1.AddressZero
            ? await utils_2.provider.getBalance(proxy.address)
            : await erc20.functions.balanceOf(proxy.address);
    };
    const getTotalAmountWithdrawn = async (assetId) => {
        return proxy.functions.totalAmountWithdrawn(assetId);
    };
    const deposit = async (assetId, amount) => {
        const preDepositValue = await getMultisigBalance(assetId);
        if (assetId === constants_1.AddressZero) {
            const tx = await wallet.sendTransaction({
                value: amount,
                to: proxy.address,
            });
            utils_2.expect(tx.hash).to.exist;
        }
        else {
            const tx = await erc20.functions.transfer(proxy.address, amount);
            utils_2.expect(tx.hash).to.exist;
        }
        utils_2.expect(await getMultisigBalance(assetId)).to.be.eq(preDepositValue.add(amount));
    };
    const withdraw = async (assetId, amount) => {
        await proxy.functions.withdraw(assetId, wallet.address, amount);
    };
    const validateOutcomes = async (params) => {
        for (const param of params) {
            const { outcome, initialState, deposit, withdrawal } = param;
            await validateOutcome(outcome, initialState, deposit, withdrawal);
        }
    };
    const validateOutcome = async (outcome, initialState, amountDeposited, amountWithdrawn = constants_1.Zero) => {
        const decoded = decodeTransfers(outcome);
        utils_2.expect(decoded[0].to).eq(initialState.transfers[0].to);
        utils_2.expect(decoded[0].amount).eq(amountDeposited);
        utils_2.expect(decoded[1].to).eq(initialState.transfers[1].to);
        utils_2.expect(decoded[1].amount).eq(constants_1.Zero);
        const multisigBalance = await getMultisigBalance(initialState.assetId);
        utils_2.expect(multisigBalance).to.be.eq(initialState.startingMultisigBalance
            .add(amountDeposited)
            .sub(amountWithdrawn));
    };
    it("Correctly calculates deposit amount for Eth", async () => {
        const assetId = constants_1.AddressZero;
        const amount = new utils_1.BigNumber(10000);
        const initialState = await createInitialState(assetId);
        await deposit(assetId, amount);
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, amount);
    });
    it("Correctly calculates deposit amount for tokens", async () => {
        const assetId = erc20.address;
        const amount = new utils_1.BigNumber(10000);
        const initialState = await createInitialState(assetId);
        await deposit(assetId, amount);
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, amount);
    });
    it("Correctly calculates deposit amount for Eth with eth withdraw", async () => {
        const assetId = constants_1.AddressZero;
        const amount = new utils_1.BigNumber(10000);
        const initialState = await createInitialState(assetId);
        await deposit(assetId, amount);
        await withdraw(assetId, amount.div(2));
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, amount, amount.div(2));
    });
    it("Correctly calculates deposit amount for token with token withdraw", async () => {
        const assetId = erc20.address;
        const amount = new utils_1.BigNumber(10000);
        const initialState = await createInitialState(assetId);
        await deposit(assetId, amount);
        await withdraw(assetId, amount.div(2));
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, amount, amount.div(2));
    });
    it("Correctly calculates deposit amount for Eth with token withdraw", async () => {
        const assetId = constants_1.AddressZero;
        const amount = new utils_1.BigNumber(10000);
        const ethInitialState = await createInitialState(assetId);
        const tokenInitialState = await createInitialState(erc20.address);
        await deposit(assetId, amount);
        await deposit(erc20.address, amount);
        await withdraw(erc20.address, amount);
        await validateOutcomes([
            {
                assetId,
                outcome: await computeOutcome(ethInitialState),
                initialState: ethInitialState,
                deposit: amount,
            },
            {
                assetId: erc20.address,
                outcome: await computeOutcome(tokenInitialState),
                initialState: tokenInitialState,
                deposit: amount,
                withdrawal: amount,
            },
        ]);
    });
    it("Correctly calculates deposit amount for token with token withdraw > deposit (should underflow)", async () => {
        const assetId = erc20.address;
        const amount = new utils_1.BigNumber(10000);
        await deposit(assetId, amount);
        const initialState = await createInitialState(assetId);
        await deposit(assetId, amount);
        await withdraw(assetId, amount.mul(2));
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, amount, amount.mul(2));
    });
    it("Correctly calculates deposit amount for token total withdraw overflow", async () => {
        const assetId = constants_1.AddressZero;
        const amount = new utils_1.BigNumber(10000);
        await deposit(assetId, MAX_INT.div(4));
        await withdraw(assetId, MAX_INT.div(4));
        await deposit(assetId, MAX_INT.div(4));
        await withdraw(assetId, MAX_INT.div(4));
        await deposit(assetId, MAX_INT.div(4).add(1000));
        await withdraw(assetId, MAX_INT.div(4).add(1000));
        await deposit(assetId, MAX_INT.div(4));
        utils_2.expect((await getTotalAmountWithdrawn(assetId)).gt(MAX_INT.sub(MAX_INT.div(4).sub(1))));
        const initialState = await createInitialState(assetId);
        await withdraw(assetId, MAX_INT.div(4).sub(1));
        await deposit(assetId, MAX_INT.div(4));
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, MAX_INT.div(4), MAX_INT.div(4).sub(1));
        await withdraw(assetId, MAX_INT.div(4));
    });
    it("Correctly calculates deposit amount for token total withdraw overflow AND expression underflow", async () => {
        const assetId = constants_1.AddressZero;
        const amount = new utils_1.BigNumber(10000);
        await deposit(assetId, MAX_INT.div(4));
        await withdraw(assetId, MAX_INT.div(4));
        await deposit(assetId, MAX_INT.div(4));
        await withdraw(assetId, MAX_INT.div(4));
        await deposit(assetId, MAX_INT.div(4).add(1000));
        await withdraw(assetId, MAX_INT.div(4).add(1000));
        await deposit(assetId, MAX_INT.div(4));
        utils_2.expect((await getTotalAmountWithdrawn(assetId)).gt(MAX_INT.sub(MAX_INT.div(4))));
        const initialState = await createInitialState(assetId);
        await withdraw(assetId, MAX_INT.div(4));
        await deposit(assetId, amount);
        const outcome = await computeOutcome(initialState);
        await validateOutcome(outcome, initialState, amount, MAX_INT.div(4));
        await withdraw(assetId, MAX_INT.div(4));
    });
});
//# sourceMappingURL=deposit-app.spec.js.map