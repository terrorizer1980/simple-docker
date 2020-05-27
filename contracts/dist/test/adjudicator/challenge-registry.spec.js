"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const utils_1 = require("@connext/utils");
const ethers_1 = require("ethers");
const utils_2 = require("ethers/utils");
const AppWithAction_json_1 = __importDefault(require("../../build/AppWithAction.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../build/ChallengeRegistry.json"));
const utils_3 = require("./utils");
describe("ChallengeRegistry", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let snapshotId;
    let ONCHAIN_CHALLENGE_TIMEOUT;
    let alice;
    let action;
    let state1;
    let state0;
    let setState;
    let setAndProgressState;
    let setOutcome;
    let progressState;
    let progressStateAndVerify;
    let cancelDisputeAndVerify;
    let verifyChallenge;
    let isProgressable;
    before(async () => {
        wallet = (await utils_3.provider.getWallets())[2];
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appRegistry = await appRegistry.deployed();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
        appDefinition = await appDefinition.deployed();
    });
    beforeEach(async () => {
        snapshotId = await utils_3.snapshot();
        const context = await utils_3.setupContext(appRegistry, appDefinition, wallet);
        ONCHAIN_CHALLENGE_TIMEOUT = context["ONCHAIN_CHALLENGE_TIMEOUT"];
        alice = context["alice"];
        state0 = context["state0"];
        action = context["action"];
        state1 = context["state1"];
        setState = context["setStateAndVerify"];
        progressState = context["progressState"];
        progressStateAndVerify = context["progressStateAndVerify"];
        setOutcome = context["setOutcomeAndVerify"];
        setAndProgressState = (versionNumber, state, turnTaker) => context["setAndProgressStateAndVerify"](versionNumber, state || state0, action, undefined, turnTaker || context["bob"]);
        verifyChallenge = context["verifyChallenge"];
        isProgressable = context["isProgressable"];
        cancelDisputeAndVerify = context["cancelDisputeAndVerify"];
    });
    afterEach(async () => {
        await utils_3.restore(snapshotId);
    });
    it("Can successfully dispute using: `setAndProgressState` + `progressState` + `setOutcome`", async () => {
        await setAndProgressState(1, state0);
        const finalizingAction = Object.assign(Object.assign({}, action), { increment: utils_1.toBN(10) });
        await progressState(state1, finalizingAction, alice);
        const finalState = {
            counter: state1.counter.add(finalizingAction.increment),
        };
        await verifyChallenge({
            appStateHash: utils_2.keccak256(utils_3.encodeState(finalState)),
            status: types_1.ChallengeStatus.EXPLICITLY_FINALIZED,
            versionNumber: utils_1.toBN(3),
        });
        await setOutcome(utils_3.encodeState(finalState));
    });
    it("Can successfully dispute using: `setState` + `setState` + `setOutcome`", async () => {
        await setState(1, utils_3.encodeState(state0));
        await setState(10, utils_3.encodeState(state0));
        await setState(15, utils_3.encodeState(state0));
        await utils_3.moveToBlock((await utils_3.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 15);
        await setOutcome(utils_3.encodeState(state0));
    });
    it("Can successfully dispute using: `setState` + `progressState` + `progressState` + `setOutcome`", async () => {
        await setState(1, utils_3.encodeState(state0));
        await setState(10, utils_3.encodeState(state0));
        await setState(15, utils_3.encodeState(state0));
        await utils_3.moveToBlock((await utils_3.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 2);
        utils_3.expect(await isProgressable()).to.be.true;
        await progressStateAndVerify(state0, action);
        await progressStateAndVerify(state1, action, alice);
        await utils_3.moveToBlock((await utils_3.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 15);
        utils_3.expect(await isProgressable()).to.be.false;
        await setOutcome(utils_3.encodeState(Object.assign(Object.assign({}, state1), { counter: state1.counter.add(action.increment) })));
    });
    it("Cannot cancel challenge at `setState` phase", async () => {
        await setState(1, utils_3.encodeState(state0));
        await utils_3.expect(cancelDisputeAndVerify(1)).to.be.revertedWith("cancelDispute called on challenge that cannot be cancelled");
        await setState(15, utils_3.encodeState(state0));
        await utils_3.expect(cancelDisputeAndVerify(15)).to.be.revertedWith("cancelDispute called on challenge that cannot be cancelled");
    });
    it("Can cancel challenge at `progressState` phase", async () => {
        await setAndProgressState(1, state0);
        await cancelDisputeAndVerify(2);
        await setAndProgressState(2, state0);
        await cancelDisputeAndVerify(3);
    });
    it("Cannot cancel challenge after outcome set", async () => {
        await setState(1, utils_3.encodeState(state0));
        await utils_3.moveToBlock((await utils_3.provider.getBlockNumber()) + ONCHAIN_CHALLENGE_TIMEOUT + 15);
        await setOutcome(utils_3.encodeState(state0));
        await utils_3.expect(cancelDisputeAndVerify(1)).to.be.revertedWith("cancelDispute called on challenge that cannot be cancelled");
    });
});
//# sourceMappingURL=challenge-registry.spec.js.map