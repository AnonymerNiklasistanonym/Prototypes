import type * as api from "../../../routes/api";
import * as general from "./general";


export const latex2Svg = async (
    input: api.latex2svg.Latex2SvgRequest
): Promise<api.latex2svg.Latex2SvgResponse> => {
    return general.apiRequest<api.latex2svg.Latex2SvgRequest, api.latex2svg.Latex2SvgResponse>(
        `${general.baseUrlApi}/latex2svg`, input
    );
};
