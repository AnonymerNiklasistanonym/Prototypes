import * as latex from "../src/modules/latex";
import chai from "chai";
import { describe } from "mocha";
import { promises as fs } from "fs";


describe("latex [shell]", () => {
    it("version", async () => {
        const version = await latex.getVersion();
        chai.expect(version.fullText).to.be.a("string");
        chai.expect(version.fullText.length).to.be.greaterThan(0);
        chai.expect(version.engine).to.be.a("string");
        chai.expect(version.engine.length).to.be.greaterThan(0);
        chai.expect(version.major).to.be.a("number");
        chai.expect(version.major).to.satisfy(Number.isInteger);
        chai.expect(version.minor).to.be.a("number");
        chai.expect(version.minor).to.satisfy(Number.isInteger);
    });

    it("latex2pdf", async () => {
        const outputPdf = await latex.tex2Pdf({
            texData: "% A simple cycle\n"
            + "% Author : Jerome Tremblay\n"
            + "\\documentclass{article}\n"
            + "\\usepackage{tikz}\n"
            + "\\begin{document}\n"
            + "\\begin{tikzpicture}\n"
            + "\n"
            + "\\def \\n {5}\n"
            + "\\def \\radius {3cm}\n"
            + "\\def \\margin {8} % margin in angles, depends on the radius\n"
            + "\n"
            + "\\foreach \\s in {1,...,\\n}\n"
            + "{\n"
            + "  \\node[draw, circle] at ({360/\\n * (\\s - 1)}:\\radius) {$\\s$};\n"
            + "  \\draw[->, >=latex] ({360/\\n * (\\s - 1)+\\margin}:\\radius) \n"
            + "    arc ({360/\\n * (\\s - 1)+\\margin}:{360/\\n * (\\s)-\\margin}:\\radius);\n"
            + "}\n"
            + "\\end{tikzpicture}\n"
            + "\\end{document}\n"
        });
        chai.assert(outputPdf.pdfData !== undefined);
        await fs.writeFile("out_latex.pdf", outputPdf.pdfData);
        await fs.unlink("out_latex.pdf");
    });
});
