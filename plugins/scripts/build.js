/*
This file is used to be the interface between the HTML DOM and the plugin.





*/

//-------------| [START] import section |----------------


const ProseMirrorJS = (typeof module !== 'undefined')? require('../scripts/proseMirror').ProseMirror : ProseMirror;
const _executeSetup = (typeof module !== 'undefined')? require('../scripts/setup').executeSetup : executeSetup;
const _buildMenu = (typeof module !== 'undefined')? require("./menuAddon").buildMenu : buildMenu;
const _buildSchema =(typeof module !== 'undefined')? require("./schema").buildSchema : buildSchema;
const _applyTheme =(typeof module !== 'undefined')? require("./menuAddon").applyTheme : applyTheme;


//-------------| [END] import section |----------------





/**
 * Build the complite editor from an HTML div with the attributes:
 * * = optional
 *  - prosemirror-editor="editor_name"
 *  - prosemirror-theme="dark/light/auto"*
 *  - prosemirror-available-style="bold;italic;underline..."*
 *
 * @param {ProseMirror} ProseMirror
 * @param {HTMLElement} editorObj
 */
function buildEditor(ProseMirror, editorObj){

    if(ProseMirror === null){
        console.error("Err: build.js > buildEditor(...): ProseMirror is undefined");
        return null;
    }

    if(editorObj === null){
        console.error("Err: build.js > buildEditor(...): EditorObj is undefined");
        return null;
    }

    const {model, view, state, example_setup} = ProseMirror;
    const {EditorView} = view;
    const {EditorState} = state;
    const {exampleSetup} = example_setup;

    let stylesAttributes = editorObj.attributes['prosemirror-available-style'];

    let styles = [];

    if(stylesAttributes){//if a custom layout has been applied
        styles = stylesAttributes.value.split(';');
    }else{//default styles
        console.warn("No 'prosemirror-available-style' found on the editor, loading default...")
        styles.push("bold")
        styles.push("italic")
        styles.push("underline")
    }

    //create the editor object
    let editor = {
        editor: editorObj
    }


    _buildSchema(ProseMirrorJS, editor, styles);
    _buildMenu(ProseMirrorJS, editor, styles)


    let content = document.querySelector('[prosemirror-content-of="'+editor.editor.attributes['prosemirror-editor'].value+'"]')

    if(content){
        content.style.display = "none";// hide the content div
        let startDoc = model.DOMParser.fromSchema(editor.schema).parse(content)

        window.view = new EditorView(editor.editor, {
            state: EditorState.create({
                doc: startDoc,
                plugins: exampleSetup({schema: editor.schema, menuContent: editor.menu.fullMenu})
            })
        })

        let theme = editor.editor.attributes['prosemirror-theme'];

        if(theme){
            _applyTheme(theme.value, editor.editor) //apply the theme editor
        }else{
            console.warn("No 'prosemirror-theme' for "+editor.editor.attributes['prosemirror-editor'].value+", set as 'auto' by default")
            _applyTheme("auto", editor.editor)// by default put the default
        }
    }else{
        console.error("Err: build.js > buildEditor(...): no 'prosemirror-content-of' for "+editor.editor.attributes['prosemirror-editor'].value)
    }


}


//--------------| execute script

/**
 * Build all the editors on the document.
 */
function buildDocument(){

    const editorsArray = document.querySelectorAll("[prosemirror-editor]");//query all editor on the document

    if(editorsArray.length > 0){
        _executeSetup();

        for(let editorObj of editorsArray){//loop through the existing editors
            buildEditor(ProseMirrorJS, editorObj)
        }
    }else{
        console.warn("No editor found on the document.")
    }



}

//run the build on load
buildDocument();


if(typeof module !== 'undefined'){//for test purposes
    module.exports.buildEditor = buildEditor;
    module.exports.buildDocument = buildDocument;
}

