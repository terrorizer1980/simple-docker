"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const AppApplyActionFails_json_1 = __importDefault(require("../../../build/AppApplyActionFails.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("progressState", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let ALICE;
    let BOB;
    let snapshotId;
    let ACTION;
    let EXPLICITLY_FINALIZING_ACTION;
    let PRE_STATE;
    let POST_STATE;
    let ONCHAIN_CHALLENGE_TIMEOUT;
    let setState;
    let progressState;
    let verifyChallenge;
    let isProgressable;
    let progressStateAndVerify;
    before(async () => {
        wallet = (await utils_1.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_1.snapshot();
        const context = await utils_1.setupContext(appRegistry, appDefinition);
        ALICE = context["alice"];
        BOB = context["bob"];
        PRE_STATE = context["state0"];
        POST_STATE = context["state1"];
        ACTION = context["action"];
        EXPLICITLY_FINALIZING_ACTION = context["explicitlyFinalizingAction"];
        ONCHAIN_CHALLENGE_TIMEOUT = context["ONCHAIN_CHALLENGE_TIMEOUT"];
        setState = context["setStateAndVerify"];
        progressState = context["progressState"];
        verifyChallenge = context["verifyChallenge"];
        isProgressable = context["isProgressable"];
        progressStateAndVerify = context["progressStateAndVerify"];
    });
    afterEach(async () => {
        await utils_1.restore(snapshotId);
    });
    it("Can call progressState", async () => {
        await verifyChallenge(utils_1.EMPTY_CHALLENGE);
        await setState(1, utils_1.encodeState(PRE_STATE));
        utils_1.expect(await isProgressable()).to.be.false;
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        utils_1.expect(await isProgressable()).to.be.true;
        await progressStateAndVerify(PRE_STATE, ACTION);
    });
    it("Can call progressState with explicitly finalizing action", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        utils_1.expect(await isProgressable()).to.be.false;
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        utils_1.expect(await isProgressable()).to.be.true;
        await progressStateAndVerify(PRE_STATE, EXPLICITLY_FINALIZING_ACTION);
    });
    it("Can be called multiple times", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        utils_1.expect(await isProgressable()).to.be.false;
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        await progressStateAndVerify(PRE_STATE, ACTION);
        await progressState(POST_STATE, ACTION, ALICE);
    });
    it("progressState should fail if dispute is not progressable", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        utils_1.expect(await isProgressable()).to.be.false;
        await utils_1.expect(progressState(POST_STATE, ACTION, ALICE)).to.be.revertedWith("progressState called on app not in a progressable state");
    });
    it("progressState should fail if incorrect state submitted", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        await utils_1.expect(progressStateAndVerify(POST_STATE, ACTION)).to.be.revertedWith("progressState called with oldAppState that does not match stored challenge");
    });
    it("progressState should fail with incorrect turn taker", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        await utils_1.expect(progressStateAndVerify(PRE_STATE, ACTION, ALICE)).to.be.revertedWith("Invalid signature");
    });
    it("progressState should fail if apply action fails", async () => {
        const failingApp = await new ethers_1.ContractFactory(AppApplyActionFails_json_1.default.abi, AppApplyActionFails_json_1.default.bytecode, wallet).deploy();
        const context = await utils_1.setupContext(appRegistry, failingApp);
        await context["setStateAndVerify"](1, utils_1.encodeState(context["state0"]));
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        utils_1.expect(await context["isProgressable"]()).to.be.true;
        await utils_1.expect(context["progressStateAndVerify"](context["state0"], context["action"])).to.be.revertedWith("applyAction fails for this app");
    });
    it("progressState should fail if applying action to old state does not match new state", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        await utils_1.expect(progressState(PRE_STATE, ACTION, BOB, PRE_STATE)).to.be.revertedWith("progressState: applying action to old state does not match new state");
    });
    it("progressState should fail if versionNumber of new state is not that of stored state plus 1", async () => {
        await setState(1, utils_1.encodeState(PRE_STATE));
        await utils_1.moveToBlock((await utils_1.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 3);
        await utils_1.expect(progressState(PRE_STATE, ACTION, BOB, POST_STATE, 1)).to.be.revertedWith("progressState: versionNumber of new state is not that of stored state plus 1");
    });
});
//# sourceMappingURL=progress-state.spec.js.map