"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("ethers/utils");
const TicTacToeApp_json_1 = __importDefault(require("../../build/TicTacToeApp.json"));
const utils_2 = require("../utils");
function decodeBytesToAppState(encodedAppState) {
    return utils_1.defaultAbiCoder.decode(["tuple(uint256 versionNumber, uint256 winner, uint256[3][3] board)"], encodedAppState)[0];
}
describe("TicTacToeApp", () => {
    let ticTacToe;
    async function computeOutcome(state) {
        return await ticTacToe.functions.computeOutcome(encodeState(state));
    }
    function encodeState(state) {
        return utils_1.defaultAbiCoder.encode([
            `
        tuple(
          uint256 versionNumber,
          uint256 winner,
          uint256[3][3] board
        )
      `,
        ], [state]);
    }
    function encodeAction(state) {
        return utils_1.defaultAbiCoder.encode([
            `
        tuple(
          uint8 actionType,
          uint256 playX,
          uint256 playY,
          tuple(
            uint8 winClaimType,
            uint256 idx
          ) winClaim
        )
      `,
        ], [state]);
    }
    async function applyAction(state, action) {
        return await ticTacToe.functions.applyAction(encodeState(state), encodeAction(action));
    }
    before(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        ticTacToe = await new ethers_1.ContractFactory(TicTacToeApp_json_1.default.abi, TicTacToeApp_json_1.default.bytecode, wallet).deploy();
    });
    describe("applyAction", () => {
        it("can place into an empty board", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            };
            const action = {
                actionType: 0,
                playX: 0,
                playY: 0,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            const ret = await applyAction(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.board[0][0]).to.eq(1);
            utils_2.expect(state.versionNumber).to.eq(1);
        });
        it("can place into an empty square", async () => {
            const preState = {
                versionNumber: 1,
                winner: 0,
                board: [
                    [1, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            };
            const action = {
                actionType: 0,
                playX: 1,
                playY: 1,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            const ret = await applyAction(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.board[1][1]).to.eq(2);
            utils_2.expect(state.versionNumber).to.eq(2);
        });
        it("cannot placeinto an occupied square", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [1, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            };
            const action = {
                actionType: 0,
                playX: 0,
                playY: 0,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            await utils_2.expect(applyAction(preState, action)).to.be.revertedWith("playMove: square is not empty");
        });
        it("can draw from a full board", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [1, 2, 1],
                    [1, 2, 2],
                    [2, 1, 2],
                ],
            };
            const action = {
                actionType: 3,
                playX: 0,
                playY: 0,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            const ret = await applyAction(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.winner).to.eq(3);
        });
        it("cannot draw from a non-full board", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [1, 2, 1],
                    [1, 0, 2],
                    [2, 1, 2],
                ],
            };
            const action = {
                actionType: 3,
                playX: 0,
                playY: 0,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            await utils_2.expect(applyAction(preState, action)).to.be.revertedWith("assertBoardIsFull: square is empty");
        });
        it("can play_and_draw from an almost full board", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [0, 2, 1],
                    [1, 2, 2],
                    [2, 1, 2],
                ],
            };
            const action = {
                actionType: 2,
                playX: 0,
                playY: 0,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            const ret = await applyAction(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.winner).to.eq(3);
        });
        it("cannot play_and_draw from a sparse board", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [0, 2, 1],
                    [1, 2, 2],
                    [2, 0, 0],
                ],
            };
            const action = {
                actionType: 2,
                playX: 0,
                playY: 0,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            await utils_2.expect(applyAction(preState, action)).to.be.revertedWith("assertBoardIsFull: square is empty");
        });
        it("can play_and_win from a winning position", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [1, 1, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            };
            const action = {
                actionType: 1,
                playX: 0,
                playY: 2,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            const ret = await applyAction(preState, action);
            const state = decodeBytesToAppState(ret);
            utils_2.expect(state.winner).to.eq(1);
        });
        it("cannot play_and_win from a non winning position", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [1, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            };
            const action = {
                actionType: 1,
                playX: 0,
                playY: 2,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            await utils_2.expect(applyAction(preState, action)).to.be.revertedWith("Win Claim not valid");
        });
    });
    describe("computeOutcome", () => {
        it("playerFirst wins should compute the outcome correctly", async () => {
            const preState = {
                versionNumber: 0,
                winner: 0,
                board: [
                    [1, 1, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
            };
            const action = {
                actionType: 1,
                playX: 0,
                playY: 2,
                winClaim: {
                    winClaimType: 0,
                    idx: 0,
                },
            };
            const appliedAction = await applyAction(preState, action);
            const state = decodeBytesToAppState(appliedAction);
            const ret = await computeOutcome(state);
            utils_2.expect(ret).to.eq(utils_1.defaultAbiCoder.encode(["uint256"], [0]));
        });
    });
});
//# sourceMappingURL=tictactoe.spec.js.map