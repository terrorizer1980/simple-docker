"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_1 = require("ethers/utils");
const SimpleLinkedTransferApp_json_1 = __importDefault(require("../../build/SimpleLinkedTransferApp.json"));
const utils_2 = require("../utils");
const singleAssetTwoPartyCoinTransferEncoding = `
  tuple(address to, uint256 amount)[2]
`;
const linkedTransferAppStateEncoding = `tuple(
  ${singleAssetTwoPartyCoinTransferEncoding} coinTransfers,
  bytes32 linkedHash,
  uint256 amount,
  address assetId,
  bytes32 paymentId,
  bytes32 preImage
)`;
const linkedTransferAppActionEncoding = `
  tuple(
    bytes32 preImage
  )
`;
function mkAddress(prefix = "0xa") {
    return prefix.padEnd(42, "0");
}
function mkHash(prefix = "0xa") {
    return prefix.padEnd(66, "0");
}
const decodeTransfers = (encodedAppState) => utils_1.defaultAbiCoder.decode([singleAssetTwoPartyCoinTransferEncoding], encodedAppState)[0];
const decodeAppState = (encodedAppState) => utils_1.defaultAbiCoder.decode([linkedTransferAppStateEncoding], encodedAppState)[0];
const encodeAppState = (state, onlyCoinTransfers = false) => {
    if (!onlyCoinTransfers)
        return utils_1.defaultAbiCoder.encode([linkedTransferAppStateEncoding], [state]);
    return utils_1.defaultAbiCoder.encode([singleAssetTwoPartyCoinTransferEncoding], [state.coinTransfers]);
};
function encodeAppAction(state) {
    return utils_1.defaultAbiCoder.encode([linkedTransferAppActionEncoding], [state]);
}
function createLinkedHash(amount, assetId, paymentId, preImage) {
    return utils_1.solidityKeccak256(["uint256", "address", "bytes32", "bytes32"], [amount, assetId, paymentId, preImage]);
}
describe("SimpleLinkedTransferApp", () => {
    let simpleLinkedTransferApp;
    async function computeOutcome(state) {
        return await simpleLinkedTransferApp.functions.computeOutcome(encodeAppState(state));
    }
    async function applyAction(state, action) {
        return await simpleLinkedTransferApp.functions.applyAction(encodeAppState(state), encodeAppAction(action));
    }
    before(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        simpleLinkedTransferApp = await new ethers_1.ContractFactory(SimpleLinkedTransferApp_json_1.default.abi, SimpleLinkedTransferApp_json_1.default.bytecode, wallet).deploy();
    });
    describe("update state", () => {
        it("can redeem a payment with correct hash", async () => {
            const senderAddr = mkAddress("0xa");
            const receiverAddr = mkAddress("0xB");
            const transferAmount = new utils_1.BigNumber(10000);
            const paymentId = mkHash("0xa");
            const preImage = mkHash("0xb");
            const assetId = constants_1.AddressZero;
            const linkedHash = createLinkedHash(transferAmount, assetId, paymentId, preImage);
            const preState = {
                amount: transferAmount,
                assetId,
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
                linkedHash,
                paymentId,
                preImage: mkHash("0x0"),
            };
            const action = {
                preImage,
            };
            let ret = await applyAction(preState, action);
            const afterActionState = decodeAppState(ret);
            utils_2.expect(afterActionState.preImage).eq(preImage);
            const postState = {
                amount: transferAmount,
                assetId,
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
                linkedHash,
                paymentId,
                preImage,
            };
            ret = await computeOutcome(afterActionState);
            const decoded = decodeTransfers(ret);
            utils_2.expect(ret).to.eq(encodeAppState(postState, true));
            utils_2.expect(decoded[0].to).eq(postState.coinTransfers[0].to);
            utils_2.expect(decoded[0].amount.toString()).eq(postState.coinTransfers[0].amount.toString());
            utils_2.expect(decoded[1].to).eq(postState.coinTransfers[1].to);
            utils_2.expect(decoded[1].amount.toString()).eq(postState.coinTransfers[1].amount.toString());
        });
    });
});
//# sourceMappingURL=simple-linked-transfer-app.spec.js.map