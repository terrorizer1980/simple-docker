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
const utils_1 = require("@connext/utils");
const utils_2 = require("ethers/utils");
const MinimumViableMultisig = __importStar(require("../build/MinimumViableMultisig.json"));
class MultisigCommitment {
    constructor(multisigAddress, multisigOwners, initiatorSignature, responderSignature) {
        this.multisigAddress = multisigAddress;
        this.multisigOwners = multisigOwners;
        this.initiatorSignature = initiatorSignature;
        this.responderSignature = responderSignature;
    }
    get signatures() {
        if (!this.initiatorSignature && !this.responderSignature) {
            return [];
        }
        return [this.initiatorSignature, this.responderSignature];
    }
    async addSignatures(signature1, signature2) {
        for (const sig of [signature1, signature2]) {
            const recovered = await utils_1.recoverAddressFromChannelMessage(this.hashToSign(), sig);
            if (recovered === this.multisigOwners[0]) {
                this.initiatorSignature = sig;
            }
            else if (recovered === this.multisigOwners[1]) {
                this.responderSignature = sig;
            }
            else {
                throw new Error(`Invalid signer detected. Got ${recovered}, expected one of: ${this.multisigOwners}`);
            }
        }
    }
    set signatures(sigs) {
        throw new Error(`Use "addSignatures" to ensure the correct sorting`);
    }
    async getSignedTransaction() {
        await this.assertSignatures();
        const multisigInput = this.getTransactionDetails();
        const txData = new utils_2.Interface(MinimumViableMultisig.abi).functions.execTransaction.encode([
            multisigInput.to,
            multisigInput.value,
            multisigInput.data,
            multisigInput.operation,
            this.signatures,
        ]);
        return { to: this.multisigAddress, value: 0, data: txData };
    }
    encode() {
        const { to, value, data, operation } = this.getTransactionDetails();
        return utils_2.solidityPack(["uint8", "address", "address", "uint256", "bytes32", "uint8"], [
            types_1.CommitmentTarget.MULTISIG,
            this.multisigAddress,
            to,
            value,
            utils_2.solidityKeccak256(["bytes"], [data]),
            operation,
        ]);
    }
    hashToSign() {
        return utils_2.keccak256(this.encode());
    }
    async assertSignatures() {
        if (!this.signatures || this.signatures.length === 0) {
            throw new Error(`No signatures detected`);
        }
    }
}
exports.MultisigCommitment = MultisigCommitment;
//# sourceMappingURL=multisig-commitment.js.map