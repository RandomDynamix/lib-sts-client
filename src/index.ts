//import axios, {AxiosInstance, AxiosResponse} from 'axios';
import fetch                                                          from 'node-fetch';
import { randomUUID }                                                 from "crypto";
import nkeys                                                          from 'ts-nkeys';

export class STSClient {
    stsEndpoint: string | null = process.env.STS_ENDPOINT || null;
    //axiosClient: AxiosInstance | null = null;

    constructor() {}

    async requestServiceJWT(nKeySeed: string, stsEndpoint: string | null = this.stsEndpoint) {
        //Verify inputs
        if(!nKeySeed || !stsEndpoint) throw 'Missing either nKeySeed or stsEndpoint';

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
            nKeyUser: nKeyPair.getPublicKey().toString(),
        };
        const verificationRequest = {
            request: stsRequest,
            verification: Buffer.from(nKeyPair.sign(Buffer.from(JSON.stringify(stsRequest)))).toString('base64')
        };
        const verifyPost = {
            method: 'post',
            body: JSON.stringify(verificationRequest),
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}
        };

        //TODO ROD HERE
        console.log(`VERIFICATION REQUEST: ${JSON.stringify(verificationRequest)}`)

        //Post Authorization Verification
        //const verifyJSON: any = await this.postJSON(`${stsEndpoint}/authorization/verification`, verificationRequest);
        const verifyReponse: any = await fetch(`${stsEndpoint}/authorization/verification`, verifyPost);
        const verifyJSON: any = await verifyReponse.json();

        //TODO ROD HERE
        console.log(`VERIFICATION RESULT: ${JSON.stringify(verifyJSON)}`)

        if(!verifyJSON.token) throw 'STS Authorization Verification Failed';

        return verifyJSON.token;
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


