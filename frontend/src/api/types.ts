import { NftResponse } from './nftTypes';


export type ApiClient = {
  getNft(): Promise<NftResponse>;
  getRoute(): Promise<any>;
  getAddr(): Promise<any>;
};
