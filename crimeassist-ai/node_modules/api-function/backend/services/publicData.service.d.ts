export interface IPCSection {
    section: string;
    title: string;
    description: string;
    punishment?: string;
    category?: string;
}
export interface NCRBCrimeStat {
    district: string;
    crimeCategory: string;
    year: number;
    totalCases: number;
    maleAccused: number;
    femaleAccused: number;
    convicted: number;
    acquitted: number;
}
export interface NCRBDistrictSummary {
    district: string;
    totalCrime: number;
    murder: number;
    robbery: number;
    theft: number;
    burglary: number;
    cybercrime: number;
    fraud: number;
    assault: number;
    kidnapping: number;
    drugOffense: number;
}
export declare function fetchIPCSections(): Promise<IPCSection[]>;
export declare function fetchKarnatakaCrimeStats(): Promise<NCRBDistrictSummary[]>;
export interface KarnatakaDistrict {
    name: string;
    code: string;
    lat: number;
    lng: number;
    population: number;
    areaSqKm: number;
    headquarters: string;
    division: string;
}
export declare function getKarnatakaDistricts(): Promise<KarnatakaDistrict[]>;
export interface PoliceStation {
    name: string;
    code: string;
    district: string;
    lat: number;
    lng: number;
    phone: string;
}
export declare function fetchPoliceStations(): Promise<PoliceStation[]>;
export declare function searchIPCSections(queryText: string): Promise<IPCSection[]>;
export declare function getIPCSectionByNumber(sectionNumber: string): Promise<IPCSection | undefined>;
//# sourceMappingURL=publicData.service.d.ts.map