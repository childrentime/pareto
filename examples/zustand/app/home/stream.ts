import { fetchJson } from "../../utils";

export const getRecommendsKey = "getRecommends";

export const getRecommends = () => fetchJson("/api/recommends");



