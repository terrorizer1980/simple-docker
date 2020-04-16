"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const AppComputeOutcomeFails_json_1 = __importDefault(require("../../../build/AppComputeOutcomeFails.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("setOutcome", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let snapshotId;
    let ONCHAIN_CHALLENGE_TIMEOUT;
    let state0;
    let state1;
    let setOutcome;
    let setAndProgressState;
    let isFinalized;
    before(async () => {
        wallet = (await utils_1.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_1.snapshot();
        const context = await utils_1.setupContext(appRegistry, appDefinition);
        ONCHAIN_CHALLENGE_TIMEOUT = context["ONCHAIN_CHALLENGE_TIMEOUT"];
        state0 = context["state0"];
        state1 = context["state1"];
        setOutcome = context["setOutcomeAndVerify"];
        isFinalized = context["isFinalized"];
        setAndProgressState =
            (versionNumber, state, turnTaker) => context["setAndProgressStateAndVerify"](versionNumber, state || state0, context["action"], undefined, turnTaker || context["bob"]);
    });
    afterEach(async () => {
        await utils_1.restore(snapshotId);
    });
    it("works", async () => {
        await setAndProgressState(1);
        await utils_1.moveToBlock(await utils_1.provider.getBlockNumber() + ONCHAIN_CHALLENGE_TIMEOUT + 2);
        utils_1.expect(await isFinalized()).to.be.true;
        await setOutcome(utils_1.encodeState(state1));
    });
    it("fails if incorrect final state", async () => {
        await setAndProgressState(1);
        await utils_1.moveToBlock(await utils_1.provider.getBlockNumber() + ONCHAIN_CHALLENGE_TIMEOUT + 2);
        utils_1.expect(await isFinalized()).to.be.true;
        await utils_1.expect(setOutcome(utils_1.encodeState(state0))).to.be.revertedWith("setOutcome called with incorrect witness data of finalState");
    });
    it("fails if not finalized", async () => {
        await setAndProgressState(1);
        utils_1.expect(await isFinalized()).to.be.false;
        await utils_1.expect(setOutcome(utils_1.encodeState(state0))).to.be.revertedWith("setOutcome can only be called after a challenge has been finalized");
    });
    it("fails if compute outcome fails", async () => {
        const failingApp = await new ethers_1.ContractFactory(AppComputeOutcomeFails_json_1.default.abi, AppComputeOutcomeFails_json_1.default.bytecode, wallet).deploy();
        const context = await utils_1.setupContext(appRegistry, failingApp);
        await context["setAndProgressStateAndVerify"](1, context["state0"], context["action"], undefined, context["bob"]);
        await utils_1.moveToBlock(await utils_1.provider.getBlockNumber() + ONCHAIN_CHALLENGE_TIMEOUT + 2);
        utils_1.expect(await context["isFinalized"]()).to.be.true;
        await utils_1.expect(context["setOutcomeAndVerify"](utils_1.encodeState(context["state1"]))).to.be.revertedWith("computeOutcome always fails for this app");
    });
});
//# sourceMappingURL=set-outcome.spec.js.map