"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const utils_1 = require("@connext/utils");
const utils_2 = require("ethers/utils");
const constants_1 = require("ethers/constants");
__export(require("./context"));
__export(require("../../utils"));
exports.randomState = (numBytes = 64) => utils_2.hexlify(utils_2.randomBytes(numBytes));
var ActionType;
(function (ActionType) {
    ActionType[ActionType["SUBMIT_COUNTER_INCREMENT"] = 0] = "SUBMIT_COUNTER_INCREMENT";
    ActionType[ActionType["ACCEPT_INCREMENT"] = 1] = "ACCEPT_INCREMENT";
})(ActionType = exports.ActionType || (exports.ActionType = {}));
var TwoPartyFixedOutcome;
(function (TwoPartyFixedOutcome) {
    TwoPartyFixedOutcome[TwoPartyFixedOutcome["SEND_TO_ADDR_ONE"] = 0] = "SEND_TO_ADDR_ONE";
    TwoPartyFixedOutcome[TwoPartyFixedOutcome["SEND_TO_ADDR_TWO"] = 1] = "SEND_TO_ADDR_TWO";
    TwoPartyFixedOutcome[TwoPartyFixedOutcome["SPLIT_AND_SEND_TO_BOTH_ADDRS"] = 2] = "SPLIT_AND_SEND_TO_BOTH_ADDRS";
})(TwoPartyFixedOutcome = exports.TwoPartyFixedOutcome || (exports.TwoPartyFixedOutcome = {}));
function encodeState(state) {
    return utils_2.defaultAbiCoder.encode([`tuple(uint256 counter)`], [state]);
}
exports.encodeState = encodeState;
function encodeAction(action) {
    return utils_2.defaultAbiCoder.encode([`tuple(uint8 actionType, uint256 increment)`], [action]);
}
exports.encodeAction = encodeAction;
function encodeOutcome() {
    return utils_2.defaultAbiCoder.encode([`uint`], [TwoPartyFixedOutcome.SEND_TO_ADDR_ONE]);
}
exports.encodeOutcome = encodeOutcome;
exports.computeCancelDisputeHash = (identityHash, versionNumber) => utils_2.keccak256(utils_2.solidityPack(["uint8", "bytes32", "uint256"], [types_1.CommitmentTarget.CANCEL_DISPUTE, identityHash, versionNumber]));
exports.appStateToHash = (state) => utils_2.keccak256(state);
exports.computeAppChallengeHash = (id, appStateHash, versionNumber, timeout) => utils_2.keccak256(utils_2.solidityPack(["uint8", "bytes32", "bytes32", "uint256", "uint256"], [types_1.CommitmentTarget.SET_STATE, id, appStateHash, versionNumber, timeout]));
class AppWithCounterClass {
    constructor(participants, multisigAddress, appDefinition, defaultTimeout, channelNonce) {
        this.participants = participants;
        this.multisigAddress = multisigAddress;
        this.appDefinition = appDefinition;
        this.defaultTimeout = defaultTimeout;
        this.channelNonce = channelNonce;
    }
    get identityHash() {
        return utils_2.keccak256(utils_2.solidityPack(["address", "uint256", "bytes32", "address", "uint256"], [
            this.multisigAddress,
            this.channelNonce,
            utils_2.keccak256(utils_2.solidityPack(["address[]"], [this.participants])),
            this.appDefinition,
            this.defaultTimeout,
        ]));
    }
    get appIdentity() {
        return {
            participants: this.participants,
            multisigAddress: this.multisigAddress,
            appDefinition: this.appDefinition,
            defaultTimeout: utils_1.toBN(this.defaultTimeout),
            channelNonce: utils_1.toBN(this.channelNonce),
        };
    }
}
exports.AppWithCounterClass = AppWithCounterClass;
exports.EMPTY_CHALLENGE = {
    versionNumber: constants_1.Zero,
    appStateHash: constants_1.HashZero,
    status: types_1.ChallengeStatus.NO_CHALLENGE,
    finalizesAt: constants_1.Zero,
};
//# sourceMappingURL=index.js.map