"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@connext/types");
const constants_1 = require("ethers/constants");
const utils_1 = require("ethers/utils");
const ConditionalTransactionDelegateTarget = __importStar(require("../build/ConditionalTransactionDelegateTarget.json"));
const multisig_commitment_1 = require("./multisig-commitment");
const iface = new utils_1.Interface(ConditionalTransactionDelegateTarget.abi);
class ConditionalTransactionCommitment extends multisig_commitment_1.MultisigCommitment {
    constructor(contractAddresses, multisig, multisigOwners, appIdentityHash, freeBalanceAppIdentityHash, interpreterAddr, interpreterParams, initiatorSignature, responderSignature) {
        super(multisig, multisigOwners, initiatorSignature, responderSignature);
        this.contractAddresses = contractAddresses;
        this.multisig = multisig;
        this.multisigOwners = multisigOwners;
        this.appIdentityHash = appIdentityHash;
        this.freeBalanceAppIdentityHash = freeBalanceAppIdentityHash;
        this.interpreterAddr = interpreterAddr;
        this.interpreterParams = interpreterParams;
        if (interpreterAddr === constants_1.AddressZero) {
            throw Error("The outcome type in this application logic contract is not supported yet.");
        }
    }
    toJson() {
        return {
            appIdentityHash: this.appIdentityHash,
            freeBalanceAppIdentityHash: this.freeBalanceAppIdentityHash,
            interpreterAddr: this.interpreterAddr,
            interpreterParams: this.interpreterParams,
            multisigAddress: this.multisigAddress,
            multisigOwners: this.multisigOwners,
            contractAddresses: this.contractAddresses,
            signatures: this.signatures,
        };
    }
    static fromJson(json) {
        return new ConditionalTransactionCommitment(json.contractAddresses, json.multisigAddress, json.multisigOwners, json.appIdentityHash, json.freeBalanceAppIdentityHash, json.interpreterAddr, json.interpreterParams, json.signatures[0], json.signatures[1]);
    }
    getTransactionDetails() {
        return {
            to: this.contractAddresses.ConditionalTransactionDelegateTarget,
            value: 0,
            data: iface.functions.executeEffectOfInterpretedAppOutcome.encode([
                this.contractAddresses.ChallengeRegistry,
                this.freeBalanceAppIdentityHash,
                this.appIdentityHash,
                this.interpreterAddr,
                this.interpreterParams,
            ]),
            operation: types_1.MultisigOperation.DelegateCall,
        };
    }
}
exports.ConditionalTransactionCommitment = ConditionalTransactionCommitment;
//# sourceMappingURL=conditional-tx-commitment.js.map