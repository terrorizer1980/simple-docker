"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_2 = require("ethers/utils");
const UnidirectionalLinkedTransferApp_json_1 = __importDefault(require("../../build/UnidirectionalLinkedTransferApp.json"));
const utils_3 = require("../utils");
var AppStage;
(function (AppStage) {
    AppStage[AppStage["POST_FUND"] = 0] = "POST_FUND";
    AppStage[AppStage["PAYMENT_CLAIMED"] = 1] = "PAYMENT_CLAIMED";
    AppStage[AppStage["CHANNEL_CLOSED"] = 2] = "CHANNEL_CLOSED";
})(AppStage || (AppStage = {}));
const singleAssetTwoPartyCoinTransferEncoding = `
  tuple(address to, uint256 amount)[2]
`;
const unidirectionalLinkedTransferAppStateEncoding = `
  tuple(
    uint8 stage,
    ${singleAssetTwoPartyCoinTransferEncoding} transfers,
    bytes32 linkedHash,
    uint256 turnNum,
    bool finalized
  )
`;
const unidirectionalLinkedTransferAppActionEncoding = `
  tuple(
    uint256 amount,
    address assetId,
    bytes32 paymentId,
    bytes32 preImage
  )
`;
function mkAddress(prefix = "0xa") {
    return prefix.padEnd(42, "0");
}
function decodeAppState(encodedAppState) {
    return utils_2.defaultAbiCoder.decode([unidirectionalLinkedTransferAppStateEncoding], encodedAppState)[0];
}
function encodeAppState(state) {
    return utils_2.defaultAbiCoder.encode([unidirectionalLinkedTransferAppStateEncoding], [state]);
}
function encodeAppAction(state) {
    return utils_2.defaultAbiCoder.encode([unidirectionalLinkedTransferAppActionEncoding], [state]);
}
function createLinkedHash(action) {
    return utils_2.solidityKeccak256(["uint256", "address", "bytes32", "bytes32"], [action.amount, action.assetId, action.paymentId, action.preImage]);
}
function assertRedeemed(state, params, valid = true) {
    const { senderAddr, redeemerAddr, linkedHash, amount, turnNum } = params;
    utils_3.expect(state.transfers[0].to.toLowerCase()).to.eq(senderAddr.toLowerCase());
    utils_3.expect(state.transfers[1].to.toLowerCase()).to.eq(redeemerAddr.toLowerCase());
    utils_3.expect(state.linkedHash).to.eq(linkedHash);
    utils_3.expect(state.finalized).to.be.true;
    utils_3.expect(state.turnNum.toString()).to.eq(turnNum.toString());
    if (!valid) {
        utils_3.expect(state.stage).to.eq(AppStage.CHANNEL_CLOSED);
        utils_3.expect(state.transfers[0].amount.toString()).to.eq(amount.toString());
        utils_3.expect(state.transfers[1].amount.toString()).to.eq("0");
        return;
    }
    utils_3.expect(state.stage).to.eq(AppStage.PAYMENT_CLAIMED);
    utils_3.expect(state.transfers[0].amount.toString()).to.eq("0");
    utils_3.expect(state.transfers[1].amount.toString()).to.eq(amount.toString());
}
describe("LinkedUnidirectionalTransferApp", () => {
    let unidirectionalLinkedTransferApp;
    const applyAction = (state, action) => unidirectionalLinkedTransferApp.functions.applyAction(encodeAppState(state), encodeAppAction(action));
    const computeOutcome = (state) => unidirectionalLinkedTransferApp.functions.computeOutcome(encodeAppState(state));
    before(async () => {
        const wallet = (await utils_3.provider.getWallets())[0];
        unidirectionalLinkedTransferApp = await new ethers_1.ContractFactory(UnidirectionalLinkedTransferApp_json_1.default.abi, UnidirectionalLinkedTransferApp_json_1.default.bytecode, wallet).deploy();
    });
    it("can redeem a payment with correct hash", async () => {
        const senderAddr = mkAddress("0xa");
        const redeemerAddr = mkAddress("0xb");
        const amount = new utils_2.BigNumber(10);
        const paymentId = utils_1.createRandom32ByteHexString();
        const preImage = utils_1.createRandom32ByteHexString();
        const action = {
            amount,
            assetId: constants_1.AddressZero,
            paymentId,
            preImage,
        };
        const linkedHash = createLinkedHash(action);
        const prevState = {
            finalized: false,
            linkedHash,
            stage: AppStage.POST_FUND,
            transfers: [
                {
                    amount,
                    to: senderAddr,
                },
                {
                    amount: constants_1.Zero,
                    to: redeemerAddr,
                },
            ],
            turnNum: constants_1.Zero,
        };
        const ret = await applyAction(prevState, action);
        const state = decodeAppState(ret);
        assertRedeemed(state, { senderAddr, redeemerAddr, linkedHash, amount, turnNum: constants_1.One });
        const res = await computeOutcome(state);
        utils_3.expect(res).to.eq(utils_2.defaultAbiCoder.encode([singleAssetTwoPartyCoinTransferEncoding], [
            [
                [senderAddr, constants_1.Zero],
                [redeemerAddr, amount],
            ],
        ]));
    });
    it("can revert the transfers if the provided secret is not correct", async () => {
        const senderAddr = mkAddress("0xa");
        const redeemerAddr = mkAddress("0xb");
        const amount = new utils_2.BigNumber(10);
        const paymentId = utils_1.createRandom32ByteHexString();
        const preImage = utils_1.createRandom32ByteHexString();
        const action = {
            amount,
            assetId: constants_1.AddressZero,
            paymentId,
            preImage,
        };
        const linkedHash = createLinkedHash(action);
        const suppliedAction = Object.assign(Object.assign({}, action), { preImage: utils_1.createRandom32ByteHexString() });
        const prevState = {
            finalized: false,
            linkedHash,
            stage: AppStage.POST_FUND,
            transfers: [
                {
                    amount,
                    to: senderAddr,
                },
                {
                    amount: constants_1.Zero,
                    to: redeemerAddr,
                },
            ],
            turnNum: constants_1.Zero,
        };
        const ret = await applyAction(prevState, suppliedAction);
        const state = decodeAppState(ret);
        assertRedeemed(state, { senderAddr, redeemerAddr, linkedHash, amount, turnNum: constants_1.One }, false);
        const res = await computeOutcome(state);
        utils_3.expect(res).to.eq(utils_2.defaultAbiCoder.encode([singleAssetTwoPartyCoinTransferEncoding], [
            [
                [senderAddr, amount],
                [redeemerAddr, constants_1.Zero],
            ],
        ]));
    });
});
//# sourceMappingURL=linked-transfer-app.spec.js.map