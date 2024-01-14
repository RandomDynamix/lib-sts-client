import axios                                                          from 'axios';
import { randomUUID }                                                 from "crypto";
import nkeys                                                          from 'ts-nkeys';

export class STSClient {
    stsEndpoint: string | null = process.env.STS_ENDPOINT || null;

    constructor() {}

    async requestServiceJWT(nKeySeed: string, stsEndpoint: string | null = this.stsEndpoint) {
        //Verify inputs
        if(!nKeySeed || !stsEndpoint) throw 'Missing either nKeySeed or stsEndpoint';

        //Extract the NKey Pair from Seed
        const nKeyPair: any = nkeys.fromSeed(Buffer.from(nKeySeed));

        //Initiate Authorization Session
        const requestID: string = randomUUID();
        const initiateResult: any = await axios.get(`${stsEndpoint}/authorization/session?requestID=${requestID}`);
        if(!initiateResult.sessionID) throw 'No STS Session established';

        //Construct Request & Sign
        const stsRequest = {
            requestID: requestID,
            sessionID: initiateResult.sessionID,
            nKeyUser: nKeyPair.getPublicKey(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))
        };

        //Post Authorization Verification
        const verifyResult: any = await axios.post(`${stsEndpoint}/authorization/verification`, verificationRequest);
        if(!verifyResult.token) throw 'STS Authorization Verification Failed';

        return verifyResult.token;
    }

    async requestUserJWT(_namespace: string, _identity: string) {}

}


