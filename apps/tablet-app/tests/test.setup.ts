import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});

globalThis.window = dom.window as any;
globalThis.document = dom.window.document as any;
globalThis.navigator = {
  userAgent: "node.js",
} as any;

// React Testing Library / jest-dom
import "@testing-library/jest-dom";
