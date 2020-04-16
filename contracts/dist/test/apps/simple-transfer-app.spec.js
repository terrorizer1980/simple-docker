"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_1 = require("ethers/utils");
const SimpleTransferApp_json_1 = __importDefault(require("../../build/SimpleTransferApp.json"));
const utils_2 = require("../utils");
const multiAssetMultiPartyCoinTransferEncoding = `
  tuple(address to, uint256 amount)[2]
`;
const transferAppStateEncoding = `tuple(
  ${multiAssetMultiPartyCoinTransferEncoding} coinTransfers
)`;
function mkAddress(prefix = "0xa") {
    return prefix.padEnd(42, "0");
}
const decodeAppState = (encodedAppState) => utils_1.defaultAbiCoder.decode([multiAssetMultiPartyCoinTransferEncoding], encodedAppState)[0];
const encodeAppState = (state, onlyCoinTransfers = false) => {
    if (!onlyCoinTransfers)
        return utils_1.defaultAbiCoder.encode([transferAppStateEncoding], [state]);
    return utils_1.defaultAbiCoder.encode([multiAssetMultiPartyCoinTransferEncoding], [state.coinTransfers]);
};
describe("SimpleTransferApp", () => {
    let simpleTransferApp;
    async function computeOutcome(state) {
        return await simpleTransferApp.functions.computeOutcome(encodeAppState(state));
    }
    before(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        simpleTransferApp = await new ethers_1.ContractFactory(SimpleTransferApp_json_1.default.abi, SimpleTransferApp_json_1.default.bytecode, wallet).deploy();
    });
    describe("update state", () => {
        it("can compute outcome with update", async () => {
            const senderAddr = mkAddress("0xa");
            const receiverAddr = mkAddress("0xB");
            const transferAmount = new utils_1.BigNumber(10000);
            const preState = {
                coinTransfers: [
                    {
                        amount: transferAmount,
                        to: senderAddr,
                    },
                    {
                        amount: constants_1.Zero,
                        to: receiverAddr,
                    },
                ],
            };
            const state = {
                coinTransfers: [
                    {
                        amount: constants_1.Zero,
                        to: senderAddr,
                    },
                    {
                        amount: transferAmount,
                        to: receiverAddr,
                    },
                ],
            };
            const ret = await computeOutcome(preState);
            utils_2.expect(ret).to.eq(encodeAppState(state, true));
            const decoded = decodeAppState(ret);
            utils_2.expect(decoded[0].to).eq(state.coinTransfers[0].to);
            utils_2.expect(decoded[0].amount.toString()).eq(state.coinTransfers[0].amount.toString());
            utils_2.expect(decoded[1].to).eq(state.coinTransfers[1].to);
            utils_2.expect(decoded[1].amount.toString()).eq(state.coinTransfers[1].amount.toString());
        });
    });
});
//# sourceMappingURL=simple-transfer-app.spec.js.map