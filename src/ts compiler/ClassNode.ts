import * as ts from "typescript";
import { doesExtend, addLeadingComments, addTrailingComments, doesImplement, hasName, addComments } from "./Utils";
import { fixMethodNode, convertMethodToFunction } from "./MethodNode";
import { ConvertState } from "./ConvertState";

export function fixClassNode(node: ts.ClassDeclaration, context: ts.TransformationContext, info: ConvertState) {

    let extendsBaseContent = false;
    let implementsTimeAware = false;

    if (node.heritageClauses) {
        for (const heritageNode of node.heritageClauses) {
            if (doesExtend(heritageNode, 'BaseContent'))
                extendsBaseContent = true;
            // else if (doesExtend(heritageNode, 'Utils'))
            //     extendsBaseContent = true;

            if (doesImplement(heritageNode, 'TimeAwareInterface'))
                implementsTimeAware = true;
        }

        if (extendsBaseContent || implementsTimeAware) {

            // const methodNames = methodNodes.map((methodNode) => methodNode.name.getText());

            const memberNodes: ts.ClassElement[] = [];
            const externalNodes: ts.FunctionDeclaration[] = [];

            for (let index = 0; index < node.members.length; index++) {
                const member = node.members[index];
                if (ts.isPropertyDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isMethodDeclaration(member)) {
                    if (implementsTimeAware && (hasName(member.name, 'timeChange') || hasName(member.name, 'timeChangeLarge'))) {
                        memberNodes.push(fixMethodNode(member, context, info));
                    }
                    else {
                        // Convert Method to Function
                        const convertedNode = convertMethodToFunction(fixMethodNode(member, context, info));

                        if (index === 0)
                            addLeadingComments(info.sourceFile.text, node, convertedNode);

                        addComments(info.sourceFile.text, member, convertedNode);

                        if (index === node.members.length - 1)
                            addTrailingComments(info.sourceFile.text, node, convertedNode);

                        externalNodes.push(convertedNode);
                    }
                }
                else if (ts.isConstructorDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isGetAccessorDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isSetAccessorDeclaration(member)) {
                    memberNodes.push(member);

                }
                else if (ts.isIndexSignatureDeclaration(member)) {
                    memberNodes.push(member);

                }
                else {
                    throw new Error('Unknown class member type ' + ts.SyntaxKind[member.kind]);
                }
            }

            if (implementsTimeAware) {
                // Remove BaseContent
                node.heritageClauses = ts.createNodeArray(node.heritageClauses.filter((heritageClause) => !doesExtend(heritageClause, 'BaseContent')));

                // Set new Memberss
                node.members = ts.createNodeArray(memberNodes);

                return [node, ...externalNodes];
            }

            return externalNodes;
        }
    }

    return node;

    // const list = [];

    // for (const childNode of node.getChildren()) {
    //     if (ts.isMethodDeclaration(childNode))
    //         list.push(convertMethodNode(childNode, context, methodNames));
    //     if (ts.isJSDocCommentContainingNode(node))
    // }

    // ts.getLeadingCommentRanges(node.getFullText(), node.pos);

    // node.forEachChild((child) => {
    //     console.log(ts.SyntaxKind[child.kind]);
    // });

    // console.log(node.getChildren().map((child) => ts.SyntaxKind[child.kind]));

    // return node.getChildren().map((childNode) => {
    //     if (ts.isMethodDeclaration(childNode))
    //         return convertMethodNode(childNode, context, methodNames)
    //     return childNode;
    // });

}
