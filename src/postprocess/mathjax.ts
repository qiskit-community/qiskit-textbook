// @ts-ignore
import { mjpage } from 'mathjax-node-page';

export async function processMathjax(htmlContent: string): Promise<string> {
  htmlContent = htmlContent.replace(/\\\\/g, '\\');
  const result = await mjpageAsync(htmlContent, {
    format: ["MathML", "TeX", "AsciiMath"], // determines type of pre-processors to run
    output: 'svg', // global override for output option; 'svg', 'html' or 'mml'
    tex: {}, // configuration options for tex pre-processor, cf. lib/tex.js
    ascii: {}, // configuration options for ascii pre-processor, cf. lib/ascii.js
    singleDollars: false, // allow single-dollar delimiter for inline TeX
    fragment: true, // return body.innerHTML instead of full document
    cssInline: true,  // determines whether inline css should be added
    displayMessages: false, // determines whether Message.Set() calls are logged
    displayErrors: false, // determines whether error messages are shown on the console
    undefinedCharError: false, // determines whether unknown characters are saved in the error array
    extensions: '', // a convenience option to add MathJax extensions
    fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
    MathJax: {}, // options MathJax configuration, see https://docs.mathjax.org
  });
  return result;
}

function mjpageAsync(content: string, mjpageConfig: any, mjnodeConfig: any = null): Promise<string> {
  return new Promise((resolve) => {
    mjpage(content, mjpageConfig, mjnodeConfig, (result: string) => {
      resolve(result);
    })
  })
}
