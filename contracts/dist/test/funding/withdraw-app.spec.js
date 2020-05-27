"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const utils_2 = require("ethers/utils");
const WithdrawApp_json_1 = __importDefault(require("../../build/WithdrawApp.json"));
const constants_1 = require("ethers/constants");
const utils_3 = require("../utils");
function mkHash(prefix = "0xa") {
    return prefix.padEnd(66, "0");
}
const decodeTransfers = (encodedTransfers) => utils_2.defaultAbiCoder.decode([types_1.singleAssetTwoPartyCoinTransferEncoding], encodedTransfers)[0];
const decodeAppState = (encodedAppState) => utils_2.defaultAbiCoder.decode([types_1.WithdrawAppStateEncoding], encodedAppState)[0];
const encodeAppState = (state, onlyCoinTransfers = false) => {
    if (!onlyCoinTransfers)
        return utils_2.defaultAbiCoder.encode([types_1.WithdrawAppStateEncoding], [state]);
    return utils_2.defaultAbiCoder.encode([types_1.singleAssetTwoPartyCoinTransferEncoding], [state.transfers]);
};
const encodeAppAction = (state) => {
    return utils_2.defaultAbiCoder.encode([types_1.WithdrawAppActionEncoding], [state]);
};
describe("WithdrawApp", async () => {
    let wallet;
    let withdrawApp;
    const withdrawerWallet = ethers_1.Wallet.createRandom();
    const counterpartyWallet = ethers_1.Wallet.createRandom();
    const bystanderWallet = ethers_1.Wallet.createRandom();
    const amount = new utils_2.BigNumber(10000);
    const data = mkHash("0xa");
    const withdrawerSigningKey = new utils_2.SigningKey(withdrawerWallet.privateKey);
    const counterpartySigningKey = new utils_2.SigningKey(counterpartyWallet.privateKey);
    const bystanderSigningKey = new utils_2.SigningKey(bystanderWallet.privateKey);
    before(async () => {
        wallet = (await utils_3.provider.getWallets())[2];
        withdrawApp = await new ethers_1.ContractFactory(WithdrawApp_json_1.default.abi, WithdrawApp_json_1.default.bytecode, wallet).deploy();
    });
    const computeOutcome = async (state) => {
        return withdrawApp.functions.computeOutcome(encodeAppState(state));
    };
    const applyAction = async (state, action) => {
        return withdrawApp.functions.applyAction(encodeAppState(state), encodeAppAction(action));
    };
    const createInitialState = async () => {
        return {
            transfers: [
                {
                    amount,
                    to: withdrawerWallet.address,
                },
                {
                    amount: constants_1.Zero,
                    to: counterpartyWallet.address,
                },
            ],
            signatures: [
                await new utils_1.ChannelSigner(withdrawerSigningKey.privateKey).signMessage(data),
                constants_1.HashZero,
            ],
            signers: [withdrawerWallet.address, counterpartyWallet.address],
            data,
            nonce: utils_2.hexlify(utils_2.randomBytes(32)),
            finalized: false,
        };
    };
    const createAction = async () => {
        return {
            signature: await new utils_1.ChannelSigner(counterpartySigningKey.privateKey).signMessage(data),
        };
    };
    it("It zeroes withdrawer balance if state is finalized (w/ valid signatures)", async () => {
        let initialState = await createInitialState();
        let action = await createAction();
        let ret = await applyAction(initialState, action);
        const afterActionState = decodeAppState(ret);
        utils_3.expect(afterActionState.signatures[1]).to.eq(action.signature);
        utils_3.expect(afterActionState.finalized).to.be.true;
        ret = await computeOutcome(afterActionState);
        const decoded = decodeTransfers(ret);
        utils_3.expect(decoded[0].to).eq(initialState.transfers[0].to);
        utils_3.expect(decoded[0].amount).eq(constants_1.Zero);
        utils_3.expect(decoded[1].to).eq(initialState.transfers[1].to);
        utils_3.expect(decoded[1].amount).eq(constants_1.Zero);
    });
    it("It cancels the withdrawal if state is not finalized", async () => {
        let initialState = await createInitialState();
        let ret = await computeOutcome(initialState);
        const decoded = decodeTransfers(ret);
        utils_3.expect(decoded[0].to).eq(initialState.transfers[0].to);
        utils_3.expect(decoded[0].amount).eq(initialState.transfers[0].amount);
        utils_3.expect(decoded[1].to).eq(initialState.transfers[1].to);
        utils_3.expect(decoded[1].amount).eq(constants_1.Zero);
    });
    it("It reverts the action if state is finalized", async () => {
        let initialState = await createInitialState();
        let action = await createAction();
        let ret = await applyAction(initialState, action);
        const afterActionState = decodeAppState(ret);
        utils_3.expect(afterActionState.signatures[1]).to.eq(action.signature);
        utils_3.expect(afterActionState.finalized).to.be.true;
        await utils_3.expect(applyAction(afterActionState, action)).revertedWith("cannot take action on a finalized state");
    });
    it("It reverts the action if withdrawer signature is invalid", async () => {
        let initialState = await createInitialState();
        let action = await createAction();
        initialState.signatures[0] = await new utils_1.ChannelSigner(bystanderSigningKey.privateKey).signMessage(data);
        await utils_3.expect(applyAction(initialState, action)).revertedWith("invalid withdrawer signature");
    });
    it("It reverts the action if counterparty signature is invalid", async () => {
        let initialState = await createInitialState();
        let action = await createAction();
        action.signature = await new utils_1.ChannelSigner(bystanderSigningKey.privateKey).signMessage(data);
        await utils_3.expect(applyAction(initialState, action)).revertedWith("invalid counterparty signature");
    });
});
//# sourceMappingURL=withdraw-app.spec.js.map