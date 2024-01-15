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

        //TODO ROD HERE
        console.log(`REQUEST ID: ${requestID}`)

        const initiateResult: any = await axios.get(`${stsEndpoint}/authorization/session?requestID=${requestID}`);

        //TODO ROD HERE
        console.log('HERE!');
        console.log(`INITIATE RESULT: ${JSON.stringify(initiateResult)}`)

        if(initiateResult.errors) throw initiateResult.errors;
        if(!initiateResult.result.session) throw 'No STS Session established';

        //Construct Request & Sign
        const stsRequest = {
            requestID: requestID,
            sessionID: initiateResult.result.session,
            nKeyUser: nKeyPair.getPublicKey(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))
        };

        //TODO ROD HERE
        console.log(`VERIFICATION REQUEST: ${JSON.stringify(verificationRequest)}`)

        //Post Authorization Verification
        const verifyResult: any = await axios.post(`${stsEndpoint}/authorization/verification`, verificationRequest);

        //TODO ROD HERE
        console.log(`VERIFICATION RESULT: ${JSON.stringify(verifyResult)}`)

        if(verifyResult.errors) throw verifyResult.errors;
        if(!verifyResult.result.token) throw 'STS Authorization Verification Failed';

        return verifyResult.result.token;
    }

    async requestUserJWT(_namespace: string, _identity: string) {}

}


