import fetch                  from 'node-fetch';
import { randomUUID }         from "crypto";
import nkeys                  from 'ts-nkeys';

export class STSClient {
    stsEndpoint: string | null = process.env.STS_ENDPOINT || null;

    constructor() {}

    async requestServiceJWT(account: string, nKeySeed: string, stsEndpoint: string | null = this.stsEndpoint) {
        //Verify inputs
        if(!account)     throw 'Missing account identifier';
        if(!nKeySeed)    throw 'Missing nKeySeed';
        if(!stsEndpoint) throw 'Missing stsEndpoint';

        //Extract the NKey Pair from Seed
        const nKeyPair: any = nkeys.fromSeed(Buffer.from(nKeySeed));

        //Initiate Authorization Session
        const requestID: string = randomUUID();
        const sessionResponse: any = await fetch(`${stsEndpoint}/authorization/session?requestID=${requestID}`);
        const sessionJSON: any = await sessionResponse.json();
        if(!sessionJSON?.session) throw 'No STS Session established';

        //Construct Request & Sign
        const stsRequest = {
            requestID: requestID,
            sessionID: sessionJSON.session,
            accountID: account,
            nKeyUser: nKeyPair.getPublicKey().toString(),
        };

        const stsRequestBuffer: Uint8Array = Buffer.from(JSON.stringify(stsRequest));
        const stsRequestSignature: any = nKeyPair.sign(stsRequestBuffer);
        const stsVerification: any = Buffer.from(stsRequestSignature).toString('base64url');
        const stsVerifyPost = {
            method: 'POST',
            body: JSON.stringify({
                request: stsRequest,
                verification: stsVerification
            }),
            headers: {'Content-Type': 'application/json'}
        };

        //Post Authorization Verification
        const authorizationReponse: any = await fetch(`${stsEndpoint}/authorization/verification`, stsVerifyPost);
        const authJSON: any = await authorizationReponse.json();
        if(!authJSON.token) throw 'STS Authorization Verification Failed';
        return authJSON.token;
    }

    async requestUserJWT(_namespace: string, _identity: string) {}

    // private async requestJSON(relativeURL: string): Promise<any> {
    //     try {
    //         if(!this.axiosClient) throw 'axiosClient === null';
    //         const axiosResponse: AxiosResponse = await this.axiosClient.get(relativeURL, {headers: {'Accept':'application/json'}});
    //         console.log(`axiosResponse: ${JSON.stringify(axiosResponse)}`);
    //
    //         if (axiosResponse.status > 300) throw `HTTP Status code: ${axiosResponse.status}`;
    //         if (axiosResponse.data.errors) throw axiosResponse.data.errors;
    //         return axiosResponse.data.result;
    //     } catch(err) {
    //         console.log(`STSClient | requestJSON Error: ${JSON.stringify(err)}`);
    //     }
    //     return null;
    // }
    // private async postJSON(relativeURL: string, postData: any): Promise<any> {
    //     try {
    //         if(!this.axiosClient) throw 'axiosClient === null';
    //         const axiosResponse: AxiosResponse = await this.axiosClient.post(relativeURL, postData,{headers: {'Content-Type':'application/json','Accept':'application/json'}});
    //         if (axiosResponse.status > 300) throw `HTTP Status code: ${axiosResponse.status}`;
    //         if (axiosResponse.data.errors) throw axiosResponse.data.errors;
    //         return axiosResponse.data.result;
    //     } catch(err) {
    //         console.log(`STSClient | postJSON Error: ${JSON.stringify(err)}`);
    //     }
    //     return null;
    // }

}


