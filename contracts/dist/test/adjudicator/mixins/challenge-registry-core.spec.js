"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("ethers/constants");
const utils_1 = require("@connext/utils");
const utils_2 = require("ethers/utils");
const utils_3 = require("../utils");
const AppWithAction_json_1 = __importDefault(require("../../../build/AppWithAction.json"));
const ChallengeRegistry_json_1 = __importDefault(require("../../../build/ChallengeRegistry.json"));
describe("MChallengeRegistryCore", () => {
    let appRegistry;
    let appDefinition;
    let wallet;
    let snapshotId;
    let ONCHAIN_CHALLENGE_TIMEOUT;
    let alice;
    let action;
    let setState;
    let setAndProgressState;
    let verifyChallenge;
    let isFinalized;
    before(async () => {
        wallet = (await utils_3.provider.getWallets())[0];
        await wallet.getTransactionCount();
        appRegistry = await new ethers_1.ContractFactory(ChallengeRegistry_json_1.default.abi, ChallengeRegistry_json_1.default.bytecode, wallet).deploy();
        appDefinition = await new ethers_1.ContractFactory(AppWithAction_json_1.default.abi, AppWithAction_json_1.default.bytecode, wallet).deploy();
    });
    beforeEach(async () => {
        snapshotId = await utils_3.snapshot();
        const context = await utils_3.setupContext(appRegistry, appDefinition);
        ONCHAIN_CHALLENGE_TIMEOUT = context["ONCHAIN_CHALLENGE_TIMEOUT"];
        alice = context["alice"];
        action = context["action"];
        setState = context["setState"];
        isFinalized = context["isFinalized"];
        verifyChallenge = context["verifyChallenge"];
        setAndProgressState =
            (versionNumber, state, turnTaker) => context["setAndProgressState"](versionNumber, state || context["state0"], context["action"], undefined, turnTaker || context["bob"]);
    });
    afterEach(async () => {
        await utils_3.restore(snapshotId);
    });
    describe("isFinalized", () => {
        it("should return true if state is explicitly finalized", async () => {
            const state = { counter: utils_1.toBN(10) };
            const resultingState = { counter: state.counter.add(action.increment) };
            await setAndProgressState(1, state, alice);
            await verifyChallenge({
                appStateHash: utils_2.keccak256(utils_3.encodeState(resultingState)),
                versionNumber: utils_1.toBN(2),
                status: 3,
            });
            utils_3.expect(await isFinalized()).to.be.true;
        });
        it("should return true if set state period elapsed", async () => {
            await setState(1);
            await verifyChallenge({
                versionNumber: constants_1.One,
                status: 1,
            });
            await utils_3.moveToBlock(await utils_3.provider.getBlockNumber() + ONCHAIN_CHALLENGE_TIMEOUT + ONCHAIN_CHALLENGE_TIMEOUT + 2);
            utils_3.expect(await isFinalized()).to.be.true;
        });
        it("should return true if state progression period elapsed", async () => {
            await setAndProgressState(1);
            await verifyChallenge({
                versionNumber: utils_1.toBN(2),
                status: 2,
            });
            await utils_3.moveToBlock(await utils_3.provider.getBlockNumber() + ONCHAIN_CHALLENGE_TIMEOUT + 2);
            utils_3.expect(await isFinalized()).to.be.true;
        });
        it("should return false if challenge is in set state period", async () => {
            await setState(1);
            await verifyChallenge({
                versionNumber: constants_1.One,
                status: 1,
            });
            utils_3.expect(await isFinalized()).to.be.false;
        });
        it("should return false if challenge is in state progression period", async () => {
            await setAndProgressState(1);
            await verifyChallenge({
                versionNumber: utils_1.toBN(2),
                status: 2,
            });
            utils_3.expect(await isFinalized()).to.be.false;
        });
        it("should return false if challenge is empty", async () => {
            utils_3.expect(await isFinalized()).to.be.false;
        });
    });
});
//# sourceMappingURL=challenge-registry-core.spec.js.map