"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("ethers/utils");
const NimApp_json_1 = __importDefault(require("../../build/NimApp.json"));
const utils_2 = require("../utils");
function decodeBytesToAppState(encodedAppState) {
    return utils_1.defaultAbiCoder.decode(["tuple(uint256 versionNumber, uint256[3] pileHeights)"], encodedAppState)[0];
}
describe("Nim", () => {
    let nim;
    function encodeState(state) {
        return utils_1.defaultAbiCoder.encode([
            `
        tuple(
          uint256 versionNumber,
          uint256[3] pileHeights
        )
      `,
        ], [state]);
    }
    function encodeAction(state) {
        return utils_1.defaultAbiCoder.encode([
            `
        tuple(
          uint256 pileIdx,
          uint256 takeAmnt
        )
      `,
        ], [state]);
    }
    async function applyAction(state, action) {
        return nim.functions.applyAction(encodeState(state), encodeAction(action));
    }
    async function isStateTerminal(state) {
        return nim.functions.isStateTerminal(encodeState(state));
    }
    before(async () => {
        const wallet = (await utils_2.provider.getWallets())[0];
        nim = await new ethers_1.ContractFactory(NimApp_json_1.default.abi, NimApp_json_1.default.bytecode, wallet).deploy();
    });
    describe("applyAction", () => {
        it("can take from a pile", async () => {
            const preState = {
                versionNumber: 0,
                pileHeights: [6, 5, 12],
            };
            const action = {
                pileIdx: 0,
                takeAmnt: 5,
            };
            const ret = await applyAction(preState, action);
            const postState = decodeBytesToAppState(ret);
            utils_2.expect(postState.pileHeights[0]).to.eq(1);
            utils_2.expect(postState.pileHeights[1]).to.eq(5);
            utils_2.expect(postState.pileHeights[2]).to.eq(12);
            utils_2.expect(postState.versionNumber).to.eq(1);
        });
        it("can take to produce an empty pile", async () => {
            const preState = {
                versionNumber: 0,
                pileHeights: [6, 5, 12],
            };
            const action = {
                pileIdx: 0,
                takeAmnt: 6,
            };
            const ret = await applyAction(preState, action);
            const postState = decodeBytesToAppState(ret);
            utils_2.expect(postState.pileHeights[0]).to.eq(0);
            utils_2.expect(postState.pileHeights[1]).to.eq(5);
            utils_2.expect(postState.pileHeights[2]).to.eq(12);
            utils_2.expect(postState.versionNumber).to.eq(1);
        });
        it("should fail for taking too much", async () => {
            const preState = {
                versionNumber: 0,
                pileHeights: [6, 5, 12],
            };
            const action = {
                pileIdx: 0,
                takeAmnt: 7,
            };
            await utils_2.expect(applyAction(preState, action)).to.be.revertedWith("invalid pileIdx");
        });
    });
    describe("isFinal", () => {
        it("empty state is final", async () => {
            const preState = {
                versionNumber: 49,
                pileHeights: [0, 0, 0],
            };
            utils_2.expect(await isStateTerminal(preState)).to.eq(true);
        });
        it("nonempty state is not final", async () => {
            const preState = {
                versionNumber: 49,
                pileHeights: [0, 1, 0],
            };
            utils_2.expect(await isStateTerminal(preState)).to.eq(false);
        });
    });
});
//# sourceMappingURL=nim.spec.js.map