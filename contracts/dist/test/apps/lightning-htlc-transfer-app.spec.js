"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_1 = require("ethers/utils");
const HashLockTransferApp_json_1 = __importDefault(require("../../build/HashLockTransferApp.json"));
const utils_2 = require("../utils");
function mkAddress(prefix = "0xa") {
    return prefix.padEnd(42, "0");
}
function mkHash(prefix = "0xa") {
    return prefix.padEnd(66, "0");
}
const decodeTransfers = (encodedAppState) => utils_1.defaultAbiCoder.decode([types_1.singleAssetTwoPartyCoinTransferEncoding], encodedAppState)[0];
const decodeAppState = (encodedAppState) => utils_1.defaultAbiCoder.decode([types_1.HashLockTransferAppStateEncoding], encodedAppState)[0];
const encodeAppState = (state, onlyCoinTransfers = false) => {
    if (!onlyCoinTransfers)
        return utils_1.defaultAbiCoder.encode([types_1.HashLockTransferAppStateEncoding], [state]);
    return utils_1.defaultAbiCoder.encode([types_1.singleAssetTwoPartyCoinTransferEncoding], [state.coinTransfers]);
};
function encodeAppAction(state) {
    return utils_1.defaultAbiCoder.encode([types_1.HashLockTransferAppActionEncoding], [state]);
}
function createLockHash(preImage) {
    return utils_1.soliditySha256(["bytes32"], [preImage]);
}
describe("LightningHTLCTransferApp", () => {
    let lightningHTLCTransferApp;
    let senderAddr;
    let receiverAddr;
    let transferAmount;
    let preImage;
    let lockHash;
    let expiry;
    let preState;
    async function computeOutcome(state) {
        return lightningHTLCTransferApp.functions.computeOutcome(encodeAppState(state));
    }
    async function applyAction(state, action) {
        return lightningHTLCTransferApp.functions.applyAction(encodeAppState(state), encodeAppAction(action));
    }
    async function validateOutcome(encodedTransfers, postState) {
        const decoded = decodeTransfers(encodedTransfers);
        utils_2.expect(encodedTransfers).to.eq(encodeAppState(postState, true));
        utils_2.expect(decoded[0].to).eq(postState.coinTransfers[0].to);
        utils_2.expect(decoded[0].amount.toString()).eq(postState.coinTransfers[0].amount.toString());
        utils_2.expect(decoded[1].to).eq(postState.coinTransfers[1].to);
        utils_2.expect(decoded[1].amount.toString()).eq(postState.coinTransfers[1].amount.toString());
    }
    beforeEach(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        lightningHTLCTransferApp = await new ethers_1.ContractFactory(HashLockTransferApp_json_1.default.abi, HashLockTransferApp_json_1.default.bytecode, wallet).deploy();
        senderAddr = mkAddress("0xa");
        receiverAddr = mkAddress("0xB");
        transferAmount = new utils_1.BigNumber(10000);
        preImage = mkHash("0xb");
        lockHash = createLockHash(preImage);
        expiry = utils_1.bigNumberify(await utils_2.provider.getBlockNumber()).add(100);
        preState = {
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
            lockHash,
            expiry,
            preImage: mkHash("0x0"),
            finalized: false,
        };
    });
    describe("update state", () => {
        it("will redeem a payment with correct hash within expiry", async () => {
            const action = {
                preImage,
            };
            let ret = await applyAction(preState, action);
            const afterActionState = decodeAppState(ret);
            const expectedPostState = {
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
                lockHash,
                preImage,
                expiry,
                finalized: true,
            };
            utils_2.expect(afterActionState.finalized).to.eq(expectedPostState.finalized);
            utils_2.expect(afterActionState.coinTransfers[0].amount).to.eq(expectedPostState.coinTransfers[0].amount);
            utils_2.expect(afterActionState.coinTransfers[1].amount).to.eq(expectedPostState.coinTransfers[1].amount);
            ret = await computeOutcome(afterActionState);
            validateOutcome(ret, expectedPostState);
        });
        it("will revert action with incorrect hash", async () => {
            const action = {
                preImage: mkHash("0xc"),
            };
            await utils_2.expect(applyAction(preState, action)).revertedWith("Hash generated from preimage does not match hash in state");
        });
        it("will revert action if already finalized", async () => {
            const action = {
                preImage,
            };
            preState.finalized = true;
            await utils_2.expect(applyAction(preState, action)).revertedWith("Cannot take action on finalized state");
        });
        it("will revert action if timeout has expired", async () => {
            const action = {
                preImage,
            };
            preState.expiry = utils_1.bigNumberify(await utils_2.provider.getBlockNumber());
            await utils_2.expect(applyAction(preState, action)).revertedWith("Cannot take action if expiry is expired");
        });
        it("will revert outcome that is not finalized with unexpired expiry", async () => {
            await utils_2.expect(computeOutcome(preState)).revertedWith("Cannot revert payment if expiry is unexpired");
        });
        it("will refund payment that is not finalized with expired expiry", async () => {
            preState.expiry = utils_1.bigNumberify(await utils_2.provider.getBlockNumber());
            let ret = await computeOutcome(preState);
            validateOutcome(ret, preState);
        });
    });
});
//# sourceMappingURL=lightning-htlc-transfer-app.spec.js.map