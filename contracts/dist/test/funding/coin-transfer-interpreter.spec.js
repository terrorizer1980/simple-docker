"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_2 = require("ethers/utils");
const DolphinCoin_json_1 = __importDefault(require("../../build/DolphinCoin.json"));
const MultiAssetMultiPartyCoinTransferInterpreter_json_1 = __importDefault(require("../../build/MultiAssetMultiPartyCoinTransferInterpreter.json"));
const utils_3 = require("../utils");
function encodeParams(params) {
    return utils_2.defaultAbiCoder.encode([`tuple(uint256[] limit, address[] tokenAddresses)`], [params]);
}
function encodeOutcome(state) {
    return utils_2.defaultAbiCoder.encode([
        `
        tuple(
          address to,
          uint256 amount
        )[][]
      `,
    ], [state]);
}
describe("MultiAssetMultiPartyCoinTransferInterpreter", () => {
    let wallet;
    let erc20;
    let multiAssetMultiPartyCoinTransferInterpreter;
    async function interpretOutcomeAndExecuteEffect(state, params) {
        return multiAssetMultiPartyCoinTransferInterpreter
            .functions
            .interpretOutcomeAndExecuteEffect(encodeOutcome(state), encodeParams(params));
    }
    async function getTotalAmountWithdrawn(assetId) {
        return multiAssetMultiPartyCoinTransferInterpreter
            .functions
            .totalAmountWithdrawn(assetId);
    }
    beforeEach(async () => {
        wallet = (await utils_3.provider.getWallets())[0];
        erc20 = await new ethers_1.ContractFactory(DolphinCoin_json_1.default.abi, DolphinCoin_json_1.default.bytecode, wallet).deploy();
        multiAssetMultiPartyCoinTransferInterpreter = await new ethers_1.ContractFactory(MultiAssetMultiPartyCoinTransferInterpreter_json_1.default.abi, MultiAssetMultiPartyCoinTransferInterpreter_json_1.default.bytecode, wallet).deploy();
        await erc20.functions.transfer(multiAssetMultiPartyCoinTransferInterpreter.address, erc20.functions.balanceOf(wallet.address));
        await wallet.sendTransaction({
            to: multiAssetMultiPartyCoinTransferInterpreter.address,
            value: new utils_2.BigNumber(100),
        });
    });
    it("Can distribute ETH coins only correctly to one person", async () => {
        const to = utils_1.getRandomAddress();
        const amount = constants_1.One;
        const preAmountWithdrawn = await getTotalAmountWithdrawn(constants_1.AddressZero);
        await interpretOutcomeAndExecuteEffect([[{ to, amount }]], {
            limit: [amount],
            tokenAddresses: [constants_1.AddressZero],
        });
        utils_3.expect(await utils_3.provider.getBalance(to)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(constants_1.AddressZero)).to.eq(preAmountWithdrawn.add(constants_1.One));
    });
    it("Can distribute ETH coins only correctly two people", async () => {
        const to1 = utils_1.getRandomAddress();
        const amount1 = constants_1.One;
        const to2 = utils_1.getRandomAddress();
        const amount2 = constants_1.One;
        const preAmountWithdrawn = await getTotalAmountWithdrawn(constants_1.AddressZero);
        await interpretOutcomeAndExecuteEffect([
            [
                { to: to1, amount: amount1 },
                { to: to2, amount: amount2 },
            ],
        ], {
            limit: [amount1.add(amount2)],
            tokenAddresses: [constants_1.AddressZero],
        });
        utils_3.expect(await utils_3.provider.getBalance(to1)).to.eq(constants_1.One);
        utils_3.expect(await utils_3.provider.getBalance(to2)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(constants_1.AddressZero)).to.eq(preAmountWithdrawn.add(constants_1.One).add(constants_1.One));
    });
    it("Can distribute ERC20 coins correctly for one person", async () => {
        const to = utils_1.getRandomAddress();
        const amount = constants_1.One;
        const preAmountWithdrawn = await getTotalAmountWithdrawn(erc20.address);
        await interpretOutcomeAndExecuteEffect([[{ to, amount }]], {
            limit: [amount],
            tokenAddresses: [erc20.address],
        });
        utils_3.expect(await erc20.functions.balanceOf(to)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(erc20.address)).to.eq(preAmountWithdrawn.add(constants_1.One));
    });
    it("Can distribute ERC20 coins only correctly two people", async () => {
        const to1 = utils_1.getRandomAddress();
        const amount1 = constants_1.One;
        const to2 = utils_1.getRandomAddress();
        const amount2 = constants_1.One;
        const preAmountWithdrawn = await getTotalAmountWithdrawn(erc20.address);
        await interpretOutcomeAndExecuteEffect([
            [
                { to: to1, amount: amount1 },
                { to: to2, amount: amount2 },
            ],
        ], {
            limit: [amount1.add(amount2)],
            tokenAddresses: [erc20.address],
        });
        utils_3.expect(await erc20.functions.balanceOf(to1)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to2)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(erc20.address)).to.eq(preAmountWithdrawn.add(constants_1.One).add(constants_1.One));
    });
    it("Can distribute both ETH and ERC20 coins to one person", async () => {
        const to = utils_1.getRandomAddress();
        const amount = constants_1.One;
        const preAmountWithdrawnToken = await getTotalAmountWithdrawn(erc20.address);
        const preAmountWithdrawnEth = await getTotalAmountWithdrawn(constants_1.AddressZero);
        await interpretOutcomeAndExecuteEffect([[{ to, amount }], [{ to, amount }]], {
            limit: [amount, amount],
            tokenAddresses: [constants_1.AddressZero, erc20.address],
        });
        utils_3.expect(await utils_3.provider.getBalance(to)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(erc20.address)).to.eq(preAmountWithdrawnToken.add(constants_1.One));
        utils_3.expect(await getTotalAmountWithdrawn(constants_1.AddressZero)).to.eq(preAmountWithdrawnEth.add(constants_1.One));
    });
    it("Can distribute a split of ETH and ERC20 coins to two people", async () => {
        const to1 = utils_1.getRandomAddress();
        const amount1 = constants_1.One;
        const to2 = utils_1.getRandomAddress();
        const amount2 = constants_1.One;
        const preAmountWithdrawnToken = await getTotalAmountWithdrawn(erc20.address);
        const preAmountWithdrawnEth = await getTotalAmountWithdrawn(constants_1.AddressZero);
        await interpretOutcomeAndExecuteEffect([[{ to: to1, amount: amount1 }], [{ to: to2, amount: amount2 }]], {
            limit: [amount1, amount2],
            tokenAddresses: [constants_1.AddressZero, erc20.address],
        });
        utils_3.expect(await utils_3.provider.getBalance(to1)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to2)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(erc20.address)).to.eq(preAmountWithdrawnToken.add(constants_1.One));
        utils_3.expect(await getTotalAmountWithdrawn(constants_1.AddressZero)).to.eq(preAmountWithdrawnEth.add(constants_1.One));
    });
    it("Can distribute a mix of ETH and ERC20 coins to two people", async () => {
        const to1 = utils_1.getRandomAddress();
        const amount1 = constants_1.One;
        const to2 = utils_1.getRandomAddress();
        const amount2 = constants_1.One;
        const preAmountWithdrawnToken = await getTotalAmountWithdrawn(erc20.address);
        const preAmountWithdrawnEth = await getTotalAmountWithdrawn(constants_1.AddressZero);
        await interpretOutcomeAndExecuteEffect([
            [
                { to: to1, amount: amount1 },
                { to: to2, amount: amount2 },
            ],
            [
                { to: to1, amount: amount1 },
                { to: to2, amount: amount2 },
            ],
        ], {
            limit: [amount1.add(amount2), amount1.add(amount2)],
            tokenAddresses: [constants_1.AddressZero, erc20.address],
        });
        utils_3.expect(await utils_3.provider.getBalance(to1)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to1)).to.eq(constants_1.One);
        utils_3.expect(await utils_3.provider.getBalance(to2)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to2)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(erc20.address)).to.eq(preAmountWithdrawnToken.add(constants_1.One).add(constants_1.One));
        utils_3.expect(await getTotalAmountWithdrawn(constants_1.AddressZero)).to.eq(preAmountWithdrawnEth.add(constants_1.One).add(constants_1.One));
    });
    it("Can distribute a mix of ETH and ERC20 coins to an unorderded list of people", async () => {
        const to1 = utils_1.getRandomAddress();
        const amount1 = constants_1.One;
        const to2 = utils_1.getRandomAddress();
        const amount2 = constants_1.One;
        const preAmountWithdrawnToken = await getTotalAmountWithdrawn(erc20.address);
        const preAmountWithdrawnEth = await getTotalAmountWithdrawn(constants_1.AddressZero);
        await interpretOutcomeAndExecuteEffect([
            [
                { to: to2, amount: amount2 },
                { to: to1, amount: amount1 },
            ],
            [
                { to: to1, amount: amount1 },
                { to: to2, amount: amount2 },
            ],
        ], {
            limit: [amount1.add(amount2), amount1.add(amount2)],
            tokenAddresses: [constants_1.AddressZero, erc20.address],
        });
        utils_3.expect(await utils_3.provider.getBalance(to1)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to1)).to.eq(constants_1.One);
        utils_3.expect(await utils_3.provider.getBalance(to2)).to.eq(constants_1.One);
        utils_3.expect(await erc20.functions.balanceOf(to2)).to.eq(constants_1.One);
        utils_3.expect(await getTotalAmountWithdrawn(erc20.address)).to.eq(preAmountWithdrawnToken.add(constants_1.One).add(constants_1.One));
        utils_3.expect(await getTotalAmountWithdrawn(constants_1.AddressZero)).to.eq(preAmountWithdrawnEth.add(constants_1.One).add(constants_1.One));
    });
});
//# sourceMappingURL=coin-transfer-interpreter.spec.js.map