"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/page",{

/***/ "(app-pages-browser)/./src/app/page.tsx":
/*!**************************!*\
  !*** ./src/app/page.tsx ***!
  \**************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Home)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/components/ui/button */ \"(app-pages-browser)/./src/components/ui/button.tsx\");\n/* harmony import */ var framer_motion__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! framer-motion */ \"(app-pages-browser)/./node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs\");\n/* harmony import */ var _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,Calendar,Gift,Heart,Sparkles,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/gift.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,Calendar,Gift,Heart,Sparkles,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/calendar.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,Calendar,Gift,Heart,Sparkles,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/bell.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,Calendar,Gift,Heart,Sparkles,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/heart.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,Calendar,Gift,Heart,Sparkles,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/users.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,Calendar,Gift,Heart,Sparkles,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/sparkles.js\");\n/* harmony import */ var _components_auth_auth_dialog__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/components/auth/auth-dialog */ \"(app-pages-browser)/./src/components/auth/auth-dialog.tsx\");\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n\n\n\n\nconst fadeIn = {\n    initial: {\n        opacity: 0,\n        y: 20\n    },\n    animate: {\n        opacity: 1,\n        y: 0\n    },\n    transition: {\n        duration: 0.5\n    }\n};\nconst features = [\n    {\n        title: \"Smart Gift Tracking\",\n        description: \"Keep track of all your gift ideas and purchases in one place\",\n        icon: _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_4__[\"default\"]\n    },\n    {\n        title: \"Event Calendar\",\n        description: \"Never miss important dates with our integrated calendar\",\n        icon: _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_5__[\"default\"]\n    },\n    {\n        title: \"Reminders\",\n        description: \"Get timely notifications for upcoming occasions\",\n        icon: _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_6__[\"default\"]\n    },\n    {\n        title: \"Gift Lists\",\n        description: \"Create and manage gift lists for different occasions\",\n        icon: _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_7__[\"default\"]\n    },\n    {\n        title: \"Collaborative Planning\",\n        description: \"Share and collaborate on gift ideas with family and friends\",\n        icon: _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_8__[\"default\"]\n    },\n    {\n        title: \"Smart Suggestions\",\n        description: \"Get personalized gift recommendations based on interests\",\n        icon: _barrel_optimize_names_Bell_Calendar_Gift_Heart_Sparkles_Users_lucide_react__WEBPACK_IMPORTED_MODULE_9__[\"default\"]\n    }\n];\nfunction Home() {\n    _s();\n    const [showAuthDialog, setShowAuthDialog] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"main\", {\n        className: \"min-h-screen\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n                className: \"relative py-20 px-4 sm:px-6 lg:px-8\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.div, {\n                    className: \"max-w-7xl mx-auto text-center\",\n                    initial: {\n                        opacity: 0,\n                        y: 20\n                    },\n                    animate: {\n                        opacity: 1,\n                        y: 0\n                    },\n                    transition: {\n                        duration: 0.5\n                    },\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.h1, {\n                            className: \"text-4xl sm:text-6xl font-bold mb-[44px] bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent\",\n                            initial: {\n                                opacity: 0\n                            },\n                            animate: {\n                                opacity: 1\n                            },\n                            transition: {\n                                delay: 0.2\n                            },\n                            children: \"Make Gift-Giving Magical\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 61,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.p, {\n                            className: \"text-xl mb-8 text-muted-foreground max-w-2xl mx-auto\",\n                            initial: {\n                                opacity: 0\n                            },\n                            animate: {\n                                opacity: 1\n                            },\n                            transition: {\n                                delay: 0.3\n                            },\n                            children: \"Plan, track, and organize your gifts effortlessly. Never forget a special occasion again!\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 69,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.div, {\n                            className: \"flex gap-4 justify-center\",\n                            initial: {\n                                opacity: 0\n                            },\n                            animate: {\n                                opacity: 1\n                            },\n                            transition: {\n                                delay: 0.4\n                            },\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__.Button, {\n                                    size: \"lg\",\n                                    className: \"rounded-full\",\n                                    onClick: ()=>setShowAuthDialog(true),\n                                    children: \"Get Started\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                                    lineNumber: 83,\n                                    columnNumber: 13\n                                }, this),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__.Button, {\n                                    size: \"lg\",\n                                    variant: \"outline\",\n                                    className: \"rounded-full\",\n                                    onClick: ()=>setShowAuthDialog(true),\n                                    children: \"Sign In\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                                    lineNumber: 86,\n                                    columnNumber: 13\n                                }, this)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 77,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                    lineNumber: 55,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                lineNumber: 54,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n                className: \"py-20 px-4 sm:px-6 lg:px-8 bg-muted/50\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"max-w-7xl mx-auto\",\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.h2, {\n                            className: \"text-3xl font-bold text-center mb-12\",\n                            ...fadeIn,\n                            children: \"Everything You Need for Perfect Gifting\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 96,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8\",\n                            children: features.map((feature, index)=>{\n                                const Icon = feature.icon;\n                                return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.div, {\n                                    className: \"p-6 rounded-xl bg-card hover:shadow-lg transition-shadow duration-300 border\",\n                                    initial: {\n                                        opacity: 0,\n                                        y: 20\n                                    },\n                                    animate: {\n                                        opacity: 1,\n                                        y: 0\n                                    },\n                                    transition: {\n                                        delay: index * 0.1\n                                    },\n                                    children: [\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Icon, {\n                                            className: \"w-12 h-12 text-primary mb-4\"\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                                            lineNumber: 113,\n                                            columnNumber: 19\n                                        }, this),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h3\", {\n                                            className: \"text-xl font-semibold mb-2\",\n                                            children: feature.title\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                                            lineNumber: 114,\n                                            columnNumber: 19\n                                        }, this),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                                            className: \"text-muted-foreground\",\n                                            children: feature.description\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                                            lineNumber: 115,\n                                            columnNumber: 19\n                                        }, this)\n                                    ]\n                                }, feature.title, true, {\n                                    fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                                    lineNumber: 106,\n                                    columnNumber: 17\n                                }, this);\n                            })\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 102,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                    lineNumber: 95,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                lineNumber: 94,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n                className: \"py-20 px-4 sm:px-6 lg:px-8\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(framer_motion__WEBPACK_IMPORTED_MODULE_10__.motion.div, {\n                    className: \"max-w-4xl mx-auto text-center\",\n                    initial: {\n                        opacity: 0,\n                        y: 20\n                    },\n                    animate: {\n                        opacity: 1,\n                        y: 0\n                    },\n                    transition: {\n                        duration: 0.5\n                    },\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h2\", {\n                            className: \"text-3xl font-bold mb-6\",\n                            children: \"Ready to Start Planning?\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 131,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                            className: \"text-xl text-muted-foreground mb-8\",\n                            children: \"Join thousands of thoughtful gift-givers who make every occasion special\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 132,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__.Button, {\n                            size: \"lg\",\n                            className: \"rounded-full\",\n                            onClick: ()=>setShowAuthDialog(true),\n                            children: \"Start Free Today\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                            lineNumber: 135,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                    lineNumber: 125,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                lineNumber: 124,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_auth_auth_dialog__WEBPACK_IMPORTED_MODULE_3__.AuthDialog, {\n                open: showAuthDialog,\n                onOpenChange: setShowAuthDialog\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n                lineNumber: 141,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\alkiv\\\\gift-planner\\\\src\\\\app\\\\page.tsx\",\n        lineNumber: 52,\n        columnNumber: 5\n    }, this);\n}\n_s(Home, \"wlXplrmk2y7ZjYzqp2jrE33F/Us=\");\n_c = Home;\nvar _c;\n$RefreshReg$(_c, \"Home\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBRztvQ0FDN0JDLFNBQVM7d0NBQUVGLFNBQVM7d0NBQUdDLEdBQUc7b0NBQUU7b0NBQzVCRSxZQUFZO3dDQUFFYyxPQUFPUSxRQUFRO29DQUFJOztzREFFakMsOERBQUNDOzRDQUFLYixXQUFVOzs7Ozs7c0RBQ2hCLDhEQUFDYzs0Q0FBR2QsV0FBVTtzREFBOEJXLFFBQVFsQixLQUFLOzs7Ozs7c0RBQ3pELDhEQUFDWTs0Q0FBRUwsV0FBVTtzREFBeUJXLFFBQVFqQixXQUFXOzs7Ozs7O21DQVJwRGlCLFFBQVFsQixLQUFLOzs7Ozs0QkFXeEI7Ozs7Ozs7Ozs7Ozs7Ozs7OzBCQU1OLDhEQUFDUTtnQkFBUUQsV0FBVTswQkFDakIsNEVBQUN2QixrREFBTUEsQ0FBQ3lCLEdBQUc7b0JBQ1RGLFdBQVU7b0JBQ1ZkLFNBQVM7d0JBQUVDLFNBQVM7d0JBQUdDLEdBQUc7b0JBQUc7b0JBQzdCQyxTQUFTO3dCQUFFRixTQUFTO3dCQUFHQyxHQUFHO29CQUFFO29CQUM1QkUsWUFBWTt3QkFBRUMsVUFBVTtvQkFBSTs7c0NBRTVCLDhEQUFDa0I7NEJBQUdULFdBQVU7c0NBQTBCOzs7Ozs7c0NBQ3hDLDhEQUFDSzs0QkFBRUwsV0FBVTtzQ0FBcUM7Ozs7OztzQ0FHbEQsOERBQUN4Qix5REFBTUE7NEJBQUM4QixNQUFLOzRCQUFLTixXQUFVOzRCQUFlTyxTQUFTLElBQU1ULGtCQUFrQjtzQ0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7MEJBTXZGLDhEQUFDZCxvRUFBVUE7Z0JBQUMrQixNQUFNbEI7Z0JBQWdCbUIsY0FBY2xCOzs7Ozs7Ozs7Ozs7QUFHdEQ7R0FoR3dCRjtLQUFBQSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxhbGtpdlxcZ2lmdC1wbGFubmVyXFxzcmNcXGFwcFxccGFnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCJcclxuXHJcbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCJcclxuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSBcIkAvY29tcG9uZW50cy91aS9idXR0b25cIlxyXG5pbXBvcnQgeyBtb3Rpb24gfSBmcm9tIFwiZnJhbWVyLW1vdGlvblwiXHJcbmltcG9ydCB7IENhbGVuZGFyLCBHaWZ0LCBCZWxsLCBVc2VycywgSGVhcnQsIFNwYXJrbGVzIH0gZnJvbSBcImx1Y2lkZS1yZWFjdFwiXHJcbmltcG9ydCB7IEF1dGhEaWFsb2cgfSBmcm9tIFwiQC9jb21wb25lbnRzL2F1dGgvYXV0aC1kaWFsb2dcIlxyXG5cclxuY29uc3QgZmFkZUluID0ge1xyXG4gIGluaXRpYWw6IHsgb3BhY2l0eTogMCwgeTogMjAgfSxcclxuICBhbmltYXRlOiB7IG9wYWNpdHk6IDEsIHk6IDAgfSxcclxuICB0cmFuc2l0aW9uOiB7IGR1cmF0aW9uOiAwLjUgfVxyXG59XHJcblxyXG5jb25zdCBmZWF0dXJlcyA9IFtcclxuICB7XHJcbiAgICB0aXRsZTogXCJTbWFydCBHaWZ0IFRyYWNraW5nXCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJLZWVwIHRyYWNrIG9mIGFsbCB5b3VyIGdpZnQgaWRlYXMgYW5kIHB1cmNoYXNlcyBpbiBvbmUgcGxhY2VcIixcclxuICAgIGljb246IEdpZnRcclxuICB9LFxyXG4gIHtcclxuICAgIHRpdGxlOiBcIkV2ZW50IENhbGVuZGFyXCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJOZXZlciBtaXNzIGltcG9ydGFudCBkYXRlcyB3aXRoIG91ciBpbnRlZ3JhdGVkIGNhbGVuZGFyXCIsXHJcbiAgICBpY29uOiBDYWxlbmRhclxyXG4gIH0sXHJcbiAge1xyXG4gICAgdGl0bGU6IFwiUmVtaW5kZXJzXCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJHZXQgdGltZWx5IG5vdGlmaWNhdGlvbnMgZm9yIHVwY29taW5nIG9jY2FzaW9uc1wiLFxyXG4gICAgaWNvbjogQmVsbFxyXG4gIH0sXHJcbiAge1xyXG4gICAgdGl0bGU6IFwiR2lmdCBMaXN0c1wiLFxyXG4gICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIGFuZCBtYW5hZ2UgZ2lmdCBsaXN0cyBmb3IgZGlmZmVyZW50IG9jY2FzaW9uc1wiLFxyXG4gICAgaWNvbjogSGVhcnRcclxuICB9LFxyXG4gIHtcclxuICAgIHRpdGxlOiBcIkNvbGxhYm9yYXRpdmUgUGxhbm5pbmdcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIlNoYXJlIGFuZCBjb2xsYWJvcmF0ZSBvbiBnaWZ0IGlkZWFzIHdpdGggZmFtaWx5IGFuZCBmcmllbmRzXCIsXHJcbiAgICBpY29uOiBVc2Vyc1xyXG4gIH0sXHJcbiAge1xyXG4gICAgdGl0bGU6IFwiU21hcnQgU3VnZ2VzdGlvbnNcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIkdldCBwZXJzb25hbGl6ZWQgZ2lmdCByZWNvbW1lbmRhdGlvbnMgYmFzZWQgb24gaW50ZXJlc3RzXCIsXHJcbiAgICBpY29uOiBTcGFya2xlc1xyXG4gIH1cclxuXVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSG9tZSgpIHtcclxuICBjb25zdCBbc2hvd0F1dGhEaWFsb2csIHNldFNob3dBdXRoRGlhbG9nXSA9IHVzZVN0YXRlKGZhbHNlKVxyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPG1haW4gY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuXCI+XHJcbiAgICAgIHsvKiBIZXJvIFNlY3Rpb24gKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJlbGF0aXZlIHB5LTIwIHB4LTQgc206cHgtNiBsZzpweC04XCI+XHJcbiAgICAgICAgPG1vdGlvbi5kaXYgXHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJtYXgtdy03eGwgbXgtYXV0byB0ZXh0LWNlbnRlclwiXHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDAuNSB9fVxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxtb3Rpb24uaDEgXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtNHhsIHNtOnRleHQtNnhsIGZvbnQtYm9sZCBtYi1bNDRweF0gYmctZ3JhZGllbnQtdG8tciBmcm9tLXB1cnBsZS02MDAgdG8tcGluay02MDAgYmctY2xpcC10ZXh0IHRleHQtdHJhbnNwYXJlbnRcIlxyXG4gICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAgfX1cclxuICAgICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxIH19XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb249e3sgZGVsYXk6IDAuMiB9fVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICBNYWtlIEdpZnQtR2l2aW5nIE1hZ2ljYWxcclxuICAgICAgICAgIDwvbW90aW9uLmgxPlxyXG4gICAgICAgICAgPG1vdGlvbi5wIFxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXhsIG1iLTggdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1heC13LTJ4bCBteC1hdXRvXCJcclxuICAgICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwIH19XHJcbiAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSB9fVxyXG4gICAgICAgICAgICB0cmFuc2l0aW9uPXt7IGRlbGF5OiAwLjMgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAgUGxhbiwgdHJhY2ssIGFuZCBvcmdhbml6ZSB5b3VyIGdpZnRzIGVmZm9ydGxlc3NseS4gTmV2ZXIgZm9yZ2V0IGEgc3BlY2lhbCBvY2Nhc2lvbiBhZ2FpbiFcclxuICAgICAgICAgIDwvbW90aW9uLnA+XHJcbiAgICAgICAgICA8bW90aW9uLmRpdiBcclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBnYXAtNCBqdXN0aWZ5LWNlbnRlclwiXHJcbiAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCB9fVxyXG4gICAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEgfX1cclxuICAgICAgICAgICAgdHJhbnNpdGlvbj17eyBkZWxheTogMC40IH19XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cImxnXCIgY2xhc3NOYW1lPVwicm91bmRlZC1mdWxsXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd0F1dGhEaWFsb2codHJ1ZSl9PlxyXG4gICAgICAgICAgICAgIEdldCBTdGFydGVkXHJcbiAgICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgICAgICA8QnV0dG9uIHNpemU9XCJsZ1wiIHZhcmlhbnQ9XCJvdXRsaW5lXCIgY2xhc3NOYW1lPVwicm91bmRlZC1mdWxsXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd0F1dGhEaWFsb2codHJ1ZSl9PlxyXG4gICAgICAgICAgICAgIFNpZ24gSW5cclxuICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICAgPC9tb3Rpb24uZGl2PlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7LyogRmVhdHVyZXMgU2VjdGlvbiAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicHktMjAgcHgtNCBzbTpweC02IGxnOnB4LTggYmctbXV0ZWQvNTBcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1heC13LTd4bCBteC1hdXRvXCI+XHJcbiAgICAgICAgICA8bW90aW9uLmgyIFxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgdGV4dC1jZW50ZXIgbWItMTJcIlxyXG4gICAgICAgICAgICB7Li4uZmFkZUlufVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICBFdmVyeXRoaW5nIFlvdSBOZWVkIGZvciBQZXJmZWN0IEdpZnRpbmdcclxuICAgICAgICAgIDwvbW90aW9uLmgyPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0yIGxnOmdyaWQtY29scy0zIGdhcC04XCI+XHJcbiAgICAgICAgICAgIHtmZWF0dXJlcy5tYXAoKGZlYXR1cmUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgSWNvbiA9IGZlYXR1cmUuaWNvblxyXG4gICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICA8bW90aW9uLmRpdlxyXG4gICAgICAgICAgICAgICAgICBrZXk9e2ZlYXR1cmUudGl0bGV9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtNiByb3VuZGVkLXhsIGJnLWNhcmQgaG92ZXI6c2hhZG93LWxnIHRyYW5zaXRpb24tc2hhZG93IGR1cmF0aW9uLTMwMCBib3JkZXJcIlxyXG4gICAgICAgICAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgeTogMCB9fVxyXG4gICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uPXt7IGRlbGF5OiBpbmRleCAqIDAuMSB9fVxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICA8SWNvbiBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgdGV4dC1wcmltYXJ5IG1iLTRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LXNlbWlib2xkIG1iLTJcIj57ZmVhdHVyZS50aXRsZX08L2gzPlxyXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj57ZmVhdHVyZS5kZXNjcmlwdGlvbn08L3A+XHJcbiAgICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XHJcbiAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICB9KX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7LyogQ1RBIFNlY3Rpb24gKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInB5LTIwIHB4LTQgc206cHgtNiBsZzpweC04XCI+XHJcbiAgICAgICAgPG1vdGlvbi5kaXYgXHJcbiAgICAgICAgICBjbGFzc05hbWU9XCJtYXgtdy00eGwgbXgtYXV0byB0ZXh0LWNlbnRlclwiXHJcbiAgICAgICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDIwIH19XHJcbiAgICAgICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cclxuICAgICAgICAgIHRyYW5zaXRpb249e3sgZHVyYXRpb246IDAuNSB9fVxyXG4gICAgICAgID5cclxuICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgbWItNlwiPlJlYWR5IHRvIFN0YXJ0IFBsYW5uaW5nPzwvaDI+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhsIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtYi04XCI+XHJcbiAgICAgICAgICAgIEpvaW4gdGhvdXNhbmRzIG9mIHRob3VnaHRmdWwgZ2lmdC1naXZlcnMgd2hvIG1ha2UgZXZlcnkgb2NjYXNpb24gc3BlY2lhbFxyXG4gICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPEJ1dHRvbiBzaXplPVwibGdcIiBjbGFzc05hbWU9XCJyb3VuZGVkLWZ1bGxcIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93QXV0aERpYWxvZyh0cnVlKX0+XHJcbiAgICAgICAgICAgIFN0YXJ0IEZyZWUgVG9kYXlcclxuICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgIDwvbW90aW9uLmRpdj5cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgPEF1dGhEaWFsb2cgb3Blbj17c2hvd0F1dGhEaWFsb2d9IG9uT3BlbkNoYW5nZT17c2V0U2hvd0F1dGhEaWFsb2d9IC8+XHJcbiAgICA8L21haW4+XHJcbiAgKVxyXG59ICJdLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsIkJ1dHRvbiIsIm1vdGlvbiIsIkNhbGVuZGFyIiwiR2lmdCIsIkJlbGwiLCJVc2VycyIsIkhlYXJ0IiwiU3BhcmtsZXMiLCJBdXRoRGlhbG9nIiwiZmFkZUluIiwiaW5pdGlhbCIsIm9wYWNpdHkiLCJ5IiwiYW5pbWF0ZSIsInRyYW5zaXRpb24iLCJkdXJhdGlvbiIsImZlYXR1cmVzIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImljb24iLCJIb21lIiwic2hvd0F1dGhEaWFsb2ciLCJzZXRTaG93QXV0aERpYWxvZyIsIm1haW4iLCJjbGFzc05hbWUiLCJzZWN0aW9uIiwiZGl2IiwiaDEiLCJkZWxheSIsInAiLCJzaXplIiwib25DbGljayIsInZhcmlhbnQiLCJoMiIsIm1hcCIsImZlYXR1cmUiLCJpbmRleCIsIkljb24iLCJoMyIsIm9wZW4iLCJvbk9wZW5DaGFuZ2UiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/app/page.tsx\n"));

/***/ })

});