"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("setAndProgressState", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let snapshotId;
    let state0;
    let action;
    let setAndProgressState;
    let setAndProgressStateAndVerify;
    before(async () => {
        wallet = (await utils_1.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_1.snapshot();
        const context = await utils_1.setupContext(appRegistry, appDefinition);
        state0 = context["state0"];
        action = context["action"];
        setAndProgressState = context["setAndProgressState"];
        setAndProgressStateAndVerify = context["setAndProgressStateAndVerify"];
    });
    afterEach(async () => {
        await utils_1.restore(snapshotId);
    });
    it("should work if the timeout is 0", async () => {
        await setAndProgressStateAndVerify(1, state0, action);
    });
    it("should fail if timeout is nonzero", async () => {
        await utils_1.expect(setAndProgressState(1, state0, action, 13)).to.be.revertedWith("progressState called on app not in a progressable state");
    });
});
//# sourceMappingURL=set-and-progress-state.spec.js.map