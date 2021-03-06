/*
This has the purpose to building the schema of a given editor.

Marks def: An existing DOM object update.
Example: <p>test<p/> -> *adding bold* -> <p><b>test/b></p> (changing the text to bold style without changing the content)

Nodes def: Introducing a new node to the existing DOM.
Example: <p>test</p> -> *adding image* -> <p>test<img src="src_test.com" ></p> (Adding an image put a change to the content)

available Marks:
 - bold
 - italic
 - underline
 - code
 - link
 - video-link

available nodes:
 - blockquote
 - horizontal-rule
 - image
 - break
 - emoji
 - list
*/


const _emojis_list = (typeof module !== 'undefined')? require("./static-data").emojis : emojis;


/**
 * Make the marks available on the editor
 *
 * @param {Array} styles the setup styles.
 * @returns {JSON} list of marks
 */
function makeMarks(styles){

    if(!styles){
        console.error("Err: schema.js > makeMarks(...):parameter 'styles' is undefined")
        return;
    }

    let marks = {}

    if(styles.includes('bold')){
        marks.strong = {
            parseDOM: [{tag: "b"},{ tag: "strong"},
                {tag: "b", getAttrs: (node) => node.style.fontWeight !== "normal" && null},
                {style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null}],
            toDOM() { return ["b", 0] }
        }
    }

    if(styles.includes('italic')){
        marks.em = {
            parseDOM: [{tag: "i"}, {tag: "em"}, {style: "font-style=italic"}],
            toDOM() { return ["i", 0] }
        }
    }

    if(styles.includes('underline')){

        marks.underline = {
            parseDOM: [{tag: "u"}, {style: "text-decoration: underline"}],
            toDOM() { return ["u", 0] }
        }

    }

    if(styles.includes('code')){
        marks.code=  {
            parseDOM: [{tag: "code"}],
            toDOM() { return ["code", 0] }
        }

    }

    if(styles.includes('link')){
        marks.link= {
            attrs: {
                href: {},
            },
            inclusive: false,
            parseDOM: [{tag: "a[href]", getAttrs(dom) {
                    return {href: dom.getAttribute("href")}
                }}],
            toDOM(node) { let {href} = node.attrs; return ["a", {href}, 0] }
        }
    }

    if(styles.includes('video-link')){
        marks.video_link= {

            attrs: {
                href: {},
            },
            inclusive: false,
            parseDOM: [{tag: "a[href]", getAttrs(dom) {
                    return {href: dom.getAttribute("href")}
                }}],
            toDOM(node, state) {
                let {href} = node.attrs;
                console.log(state)
                return ["a", {href}, 0]
            }
        }
    }

    return marks;
}


/**
 * Make the nodes available on the editor
 *
 * @param {Array} styles the setup styles.
 * @returns {JSON} list of nodes
 */
function makeNodes(styles){

    if(!styles){
        console.error("Err: schema.js > makeNodes(...):parameter 'styles' is undefined")
        return;
    }

    //doc, paragraph and text are require to work
    const nodes = {

        doc: {
            content: "block+"
        },

        paragraph: {
            content: "inline*",
            group: "block",
            parseDOM: [{tag: "p"}],
            toDOM() { return ["p", 0] }
        },

        text: {
            group: "inline"
        },

    }

    if(styles.includes('blockquote')){
        nodes.blockquote= {
            content: "block+",
            group: "block",
            defining: true,
            parseDOM: [{tag: "blockquote"}],
            toDOM() { return  ["blockquote", 0] }
        }
    }

    if(styles.includes('horizontal-rule')) {
        nodes.horizontal_rule = {
            group: "block",
            parseDOM:[{tag: "hr"}],
            toDOM(){return ["hr"]}
        }
    }

    if(styles.includes('image')) {
        nodes.image = {
            inline: true,
            attrs: {
                src: {},
                alt: {default: null},
                title: {default: null}
            },
            group: "inline",
            draggable: true,
            parseDOM: [{tag: "img[src]", getAttrs(dom) {
                    return {
                        src: dom.getAttribute("src"),
                        title: dom.getAttribute("title"),
                        alt: dom.getAttribute("alt")
                    }
                }}],
            toDOM(node) { let {src, alt, title} = node.attrs; return ["img", {src, alt, title}] }
        }
    }

    if(styles.includes('break')){
        nodes.hard_break = {
            inline: true,
            group: "inline",
            selectable: false,
            parseDOM: [{tag: "br"}],
            toDOM() { return ["br"]}
        }
    }

    if(styles.includes('emoji')){
        nodes.emoji= {
            attrs: {type: {default: _emojis_list[0]}},
            inline: true,
            group: "inline",
            draggable: true,

            toDOM: node => ["p", {type: node.attrs.type.emoji}],

            parseDOM: [{
                tag: "p",
                getAttrs: dom => {
                    let type = dom.getAttribute("type")
                    dom.innerText = type;
                    return _emojis_list.indexOf(type) > -1 ? {type} : false
                }
            }]
        }
    }



    return nodes;
}


/**
 * Add a custom schema to an editor.
 *
 * @param {ProseMirror} ProseMirror the ProseMirror plugin
 * @param {json} editor the editor object
 * @param {Array} stylesArray the list of style setup
 */
function buildSchema(ProseMirror, editor, stylesArray){

    if(!ProseMirror){
        console.error("Err: schema.js > buildSchema(...):parameter 'ProseMirror' is undefined")
    }

    if(!editor){
        console.error("Err: schema.js > buildSchema(...):parameter 'editor' is undefined")
    }

    if(!stylesArray){
        console.error("Err: schema.js > buildSchema(...):parameter 'stylesArray' is undefined")
    }

    if(!ProseMirror || !editor || !stylesArray){
        console.warn("Since not all parameters are defined, no schema can be build")
        return;
    }


    const {Schema} = ProseMirror.model;
    const {addListNodes} = ProseMirror.schema_list;

    let marks = makeMarks(stylesArray);
    let nodes = makeNodes(stylesArray);

    if(stylesArray.includes('list')){

        let  baseSchema = new Schema({
            nodes,
            marks})


        editor.schema = new Schema({
            nodes: addListNodes(baseSchema.spec.nodes, "paragraph block*", "block"), // adding bullet lists
            marks})

    }else{

        editor.schema = new Schema({
            nodes,
            marks})
    }

}


if(typeof module !== 'undefined'){//for test purposes
    module.exports.buildSchema = buildSchema
    module.exports.makeMarks = makeMarks;
    module.exports.makeNodes = makeNodes;
}