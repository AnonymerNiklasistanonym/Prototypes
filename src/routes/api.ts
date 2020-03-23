import * as express from "express";
import { StartExpressServerOptions } from "../config/express";
import { debuglog } from "util";
import * as latex from "../modules/latex";
import * as inkscape from "../modules/inkscape";

const debug = debuglog("app-express-route-api");

interface Latex2SvgCacheEntry {
    date: Date
    svgData: string
}

const latex2SvgCache = new Map<string,Latex2SvgCacheEntry>();
const latex2SvgCacheMaxSize = 150;
let latestRequestDate = "";

const sleep = async (millisec: number): Promise<void> => new Promise(resolve => setTimeout(resolve, millisec));

export const register = (app: express.Application, options: StartExpressServerOptions): void => {

    // eslint-disable-next-line complexity
    app.post("/api/latex2svg", async (req, res) => {
        debug(`Got: latexStringHash=${req.body.latexStringHash}, apiVersion=${req.body.apiVersion}`);
        if (req.body.apiVersion !== 1) {
            return res.status(404).send("This api version is not supported");
        }
        // Check first if the version was already converted
        const id = req.body.latexStringHash;
        const cachedSvgData = latex2SvgCache.get(id);
        if (cachedSvgData) {
            // If found refresh date
            latex2SvgCache.set(id, { svgData: cachedSvgData.svgData, date: new Date() });
            debug(`latex2svg: Found compiled version in the cache (id=${id})`);
            return res.status(200).json({ svgData: cachedSvgData.svgData, id });
        }
        // If not cached wait some time to not kill the server with requests and check if there are
        // immediately new requests
        const currentRequestDate = req.body.timeOfRequest;
        latestRequestDate = currentRequestDate;
        await sleep(500);
        // If there was no new document time continue, otherwise kill request
        if (latestRequestDate !== req.body.timeOfRequest) {
            debug(`latex2svg: A later request (${latestRequestDate}) was found so the current request`
                  + `(${currentRequestDate}) was discarded`);
            return res.status(200).json({
                svgData: "<svg></svg>",
                id: req.body.latexStringHash
            });
        }

        // If not try to convert it
        const headerIncludes = req.body.latexHeaderIncludes as string[];
        const texData = "\\documentclass[tikz]{standalone}\n"
                          + headerIncludes.join("\n")
                          + "\\begin{document}\n"
                          + req.body.latexString + "\n"
                          + "\\end{document}\n";
        debug(`latex2svg: Render tex to pdf (texData=${texData})`);
        try {
            const tex2PdfOut = await latex.tex2Pdf({
                texData,
                xelatexOptions: { interactionNonstop: true }
            });
            const pdf2SvgOut = await inkscape.pdf2Svg({
                pdfData: tex2PdfOut.pdfData,
                inkscapeOptions: { usePoppler: true }
            });
            debug("latex2svg: Render of tex to pdf complete");
            res.status(200).json({
                svgData: pdf2SvgOut.svgData,
                id: req.body.latexStringHash
            });
            // Add it to the cache
            latex2SvgCache.set(id, { svgData: pdf2SvgOut.svgData, date: new Date() });
            // If cache reaches a specific size, remove older items
            if (latex2SvgCache.size > latex2SvgCacheMaxSize) {
                let oldestCacheEntry;
                for (const [key, value] of latex2SvgCache.entries()) {
                    if (oldestCacheEntry) {
                        if (oldestCacheEntry.date > value.date) {
                            oldestCacheEntry = { id: key, date: value.date };
                        }
                    } else {
                        oldestCacheEntry = { id: key, date: value.date };
                    }
                }
                // Remove oldest cache entry
                if (oldestCacheEntry) {
                    latex2SvgCache.delete(oldestCacheEntry.id);
                }
            }
        } catch(err) {
            debug(`latex2svg: Error when converting tex to pdf: ${err}`);
            res.status(500).json({
                error: err,
                id: req.body.latexStringHash
            });
        }
    });
};
