"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_1 = require("ethers/utils");
const HighRollerApp_json_1 = __importDefault(require("../../build/HighRollerApp.json"));
const utils_2 = require("../utils");
function computeCommitHash(appSalt, chosenNumber) {
    return utils_1.solidityKeccak256(["bytes32", "uint256"], [appSalt, chosenNumber]);
}
var HighRollerStage;
(function (HighRollerStage) {
    HighRollerStage[HighRollerStage["WAITING_FOR_P1_COMMITMENT"] = 0] = "WAITING_FOR_P1_COMMITMENT";
    HighRollerStage[HighRollerStage["P1_COMMITTED_TO_HASH"] = 1] = "P1_COMMITTED_TO_HASH";
    HighRollerStage[HighRollerStage["P2_COMMITTED_TO_NUM"] = 2] = "P2_COMMITTED_TO_NUM";
    HighRollerStage[HighRollerStage["P1_REVEALED_NUM"] = 3] = "P1_REVEALED_NUM";
    HighRollerStage[HighRollerStage["P1_TRIED_TO_SUBMIT_ZERO"] = 4] = "P1_TRIED_TO_SUBMIT_ZERO";
})(HighRollerStage || (HighRollerStage = {}));
var HighRollerActionType;
(function (HighRollerActionType) {
    HighRollerActionType[HighRollerActionType["COMMIT_TO_HASH"] = 0] = "COMMIT_TO_HASH";
    HighRollerActionType[HighRollerActionType["COMMIT_TO_NUM"] = 1] = "COMMIT_TO_NUM";
    HighRollerActionType[HighRollerActionType["REVEAL_NUM"] = 2] = "REVEAL_NUM";
})(HighRollerActionType || (HighRollerActionType = {}));
const rlpAppStateEncoding = `
  tuple(
    uint8 stage,
    bytes32 salt,
    bytes32 commitHash,
    uint256 playerFirstNumber,
    uint256 playerSecondNumber,
    uint256 versionNumber
  )
`;
const rlpActionEncoding = `
  tuple(
    uint8 actionType,
    uint256 number,
    bytes32 actionHash,
  )
`;
function decodeBytesToAppState(encodedAppState) {
    return utils_1.defaultAbiCoder.decode([rlpAppStateEncoding], encodedAppState)[0];
}
function encodeState(state) {
    return utils_1.defaultAbiCoder.encode([rlpAppStateEncoding], [state]);
}
function encodeAction(state) {
    return utils_1.defaultAbiCoder.encode([rlpActionEncoding], [state]);
}
describe("HighRollerApp", () => {
    let highRollerApp;
    async function computeStateTransition(state, action) {
        return await highRollerApp.functions.applyAction(encodeState(state), encodeAction(action));
    }
    async function computeOutcome(state) {
        const [decodedResult] = utils_1.defaultAbiCoder.decode(["uint256"], await highRollerApp.functions.computeOutcome(encodeState(state)));
        return decodedResult;
    }
    before(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        highRollerApp = await new ethers_1.ContractFactory(HighRollerApp_json_1.default.abi, HighRollerApp_json_1.default.bytecode, wallet).deploy();
    });
    describe("normal state transition path", () => {
        it("can commit to hash", async () => {
            const preState = {
                stage: HighRollerStage.WAITING_FOR_P1_COMMITMENT,
                salt: constants_1.HashZero,
                commitHash: constants_1.HashZero,
                playerFirstNumber: 0,
                playerSecondNumber: 0,
                versionNumber: 0,
            };
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 1;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const action = {
                actionType: HighRollerActionType.COMMIT_TO_HASH,
                number: 0,
                actionHash: hash,
            };
            const ret = await computeStateTransition(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.stage).to.eq(HighRollerStage.P1_COMMITTED_TO_HASH);
            utils_2.expect(state.commitHash).to.eq(hash);
        });
        it("can commit to num", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 1;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P1_COMMITTED_TO_HASH,
                salt: constants_1.HashZero,
                commitHash: hash,
                playerFirstNumber: 0,
                playerSecondNumber: 0,
                versionNumber: 1,
            };
            const action = {
                actionType: HighRollerActionType.COMMIT_TO_NUM,
                number: 2,
                actionHash: constants_1.HashZero,
            };
            const ret = await computeStateTransition(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.stage).to.eq(HighRollerStage.P2_COMMITTED_TO_NUM);
            utils_2.expect(state.playerSecondNumber).to.eq(2);
        });
        it("cannot commit to num == 0", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 1;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P1_COMMITTED_TO_HASH,
                salt: constants_1.HashZero,
                commitHash: hash,
                playerFirstNumber: 0,
                playerSecondNumber: 0,
                versionNumber: 1,
            };
            const action = {
                actionType: HighRollerActionType.COMMIT_TO_NUM,
                number: 0,
                actionHash: constants_1.HashZero,
            };
            await utils_2.expect(computeStateTransition(preState, action)).to.be.revertedWith("It is considered invalid to use 0 as the number.");
        });
        it("can reveal", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 1;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P2_COMMITTED_TO_NUM,
                salt: constants_1.HashZero,
                commitHash: hash,
                playerFirstNumber: 0,
                playerSecondNumber: 2,
                versionNumber: 2,
            };
            const action = {
                actionType: HighRollerActionType.REVEAL_NUM,
                number: playerFirstNumber,
                actionHash: numberSalt,
            };
            const ret = await computeStateTransition(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.stage).to.eq(HighRollerStage.P1_REVEALED_NUM);
            utils_2.expect(state.playerFirstNumber).to.eq(1);
            utils_2.expect(state.playerSecondNumber).to.eq(2);
            utils_2.expect(state.salt).to.eq(numberSalt);
        });
        it("can reveal but if reveal 0, you cheated", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 0;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P2_COMMITTED_TO_NUM,
                salt: constants_1.HashZero,
                commitHash: hash,
                playerFirstNumber: 0,
                playerSecondNumber: 2,
                versionNumber: 2,
            };
            const action = {
                actionType: HighRollerActionType.REVEAL_NUM,
                number: playerFirstNumber,
                actionHash: numberSalt,
            };
            const ret = await computeStateTransition(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.stage).to.eq(HighRollerStage.P1_TRIED_TO_SUBMIT_ZERO);
        });
        it("can end game - playerSecond wins", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 1;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P1_REVEALED_NUM,
                salt: numberSalt,
                commitHash: hash,
                playerFirstNumber: 1,
                playerSecondNumber: 2,
                versionNumber: 3,
            };
            utils_2.expect(await computeOutcome(preState)).to.eq(types_1.TwoPartyFixedOutcome.SEND_TO_ADDR_TWO);
        });
        it("can end game - draw", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 75;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P1_REVEALED_NUM,
                salt: numberSalt,
                commitHash: hash,
                playerFirstNumber: 75,
                playerSecondNumber: 45,
                versionNumber: 4,
            };
            utils_2.expect(await computeOutcome(preState)).to.eq(2);
        });
        it("can end game - playerFirst wins", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 3;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P1_REVEALED_NUM,
                salt: numberSalt,
                commitHash: hash,
                playerFirstNumber: 3,
                playerSecondNumber: 2,
                versionNumber: 5,
            };
            utils_2.expect(await computeOutcome(preState)).to.eq(types_1.TwoPartyFixedOutcome.SEND_TO_ADDR_ONE);
        });
        it("can end game - playerFirst cheated", async () => {
            const numberSalt = "0xdfdaa4d168f0be935a1e1d12b555995bc5ea67bd33fce1bc5be0a1e0a381fc90";
            const playerFirstNumber = 3;
            const hash = computeCommitHash(numberSalt, playerFirstNumber);
            const preState = {
                stage: HighRollerStage.P1_TRIED_TO_SUBMIT_ZERO,
                salt: numberSalt,
                commitHash: hash,
                playerFirstNumber: 0,
                playerSecondNumber: 2,
                versionNumber: 5,
            };
            utils_2.expect(await computeOutcome(preState)).to.eq(types_1.TwoPartyFixedOutcome.SEND_TO_ADDR_TWO);
        });
    });
});
//# sourceMappingURL=high-roller-app.spec.js.map