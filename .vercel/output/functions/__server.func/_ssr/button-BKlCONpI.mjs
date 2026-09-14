import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-BKlCONpI.js
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap", {
	variants: {
		variant: {
			primary: "bg-brass text-navy-deep hover:bg-brass-soft",
			navy: "bg-navy text-cream hover:bg-navy-mid",
			ghost: "bg-transparent text-ink hover:bg-cream-deep border border-line",
			danger: "bg-danger text-cream hover:opacity-90",
			link: "bg-transparent text-navy underline-offset-4 hover:underline px-0"
		},
		size: {
			sm: "h-8 px-2.5 text-xs rounded-sm",
			md: "h-9 px-3 text-sm rounded-sm",
			lg: "h-11 px-4 text-sm rounded-md",
			shop: "h-14 px-6 text-base rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { Button as t };
