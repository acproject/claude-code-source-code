import jsoncParser from 'jsonc-parser/lib/umd/main.js'

export const parse = jsoncParser.parse
export const parseTree = jsoncParser.parseTree
export const findNodeAtLocation = jsoncParser.findNodeAtLocation
export const getNodeValue = jsoncParser.getNodeValue
export const visit = jsoncParser.visit
export const stripComments = jsoncParser.stripComments
export const modify = jsoncParser.modify
export const applyEdits = jsoncParser.applyEdits
