import { Request, Response } from 'express';

interface ParetoPage<T extends Record<string, any> = Record<string, any>> {
    (props: {
        initialData: T;
    }): JSX.Element;
    getServerSideProps?: (req: Request, res: Response) => Promise<T>;
    setUpClientPromise?: () => void;
    [key: string]: any;
}
interface ParetoRuntimeConfig {
    pages: Record<string, ParetoPage>;
    assets: Record<string, {
        js?: string[] | string;
        css?: string[] | string;
    }>;
}

export type { ParetoPage as P, ParetoRuntimeConfig as a };
