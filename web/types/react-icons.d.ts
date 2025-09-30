declare module 'react-icons/hi' {
  import { IconType } from 'react-icons';
  export const HiSparkles: IconType;
  // Add other HI icons as needed
}

declare module 'react-icons/bi' {
  import { IconType } from 'react-icons';
  export const BiSupport: IconType;
  // Add other BI icons as needed
}

declare module 'firebase/auth' {
  export class RecaptchaVerifier {
    constructor(auth: any, containerId: string, options?: any);
    clear(): void;
    render(): Promise<any>;
  }
  export const signInWithPhoneNumber: any;
  export const signInWithCredential: any;
  export const getIdToken: any;
  export const getAuth: any;
  export class GoogleAuthProvider {
    setCustomParameters(params: any): void;
  }
  export const signInWithRedirect: any;
  export const getRedirectResult: any;
  export const signInWithPopup: any;
  export const signOut: any;
  export interface ConfirmationResult {
    confirm: (code: string) => Promise<any>;
    verificationId: string;
  }
  export class PhoneAuthProvider {
    static credential(verificationId: string, verificationCode: string): any;
  }
}

declare module 'firebase/app' {
  export const initializeApp: any;
}

declare module 'firebase/analytics' {
  export const getAnalytics: any;
}
