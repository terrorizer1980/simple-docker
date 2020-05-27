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
const utils_1 = require("ethers/utils");
const utils_2 = require("@connext/utils");
const ConditionalTransactionDelegateTarget = __importStar(require("../build/ConditionalTransactionDelegateTarget.json"));
const multisig_commitment_1 = require("./multisig-commitment");
const iface = new utils_1.Interface(ConditionalTransactionDelegateTarget.abi);
class SetupCommitment extends multisig_commitment_1.MultisigCommitment {
    constructor(contractAddresses, multisigAddress, multisigOwners, freeBalanceAppIdentity) {
        super(multisigAddress, multisigOwners);
        this.contractAddresses = contractAddresses;
        this.multisigAddress = multisigAddress;
        this.multisigOwners = multisigOwners;
        this.freeBalanceAppIdentity = freeBalanceAppIdentity;
    }
    getTransactionDetails() {
        return {
            data: iface.functions.executeEffectOfFreeBalance.encode([
                this.contractAddresses.ChallengeRegistry,
                utils_2.appIdentityToHash(this.freeBalanceAppIdentity),
                this.contractAddresses.MultiAssetMultiPartyCoinTransferInterpreter,
            ]),
            operation: types_1.MultisigOperation.DelegateCall,
            to: this.contractAddresses.ConditionalTransactionDelegateTarget,
            value: 0,
        };
    }
}
exports.SetupCommitment = SetupCommitment;
//# sourceMappingURL=setup-commitment.js.map