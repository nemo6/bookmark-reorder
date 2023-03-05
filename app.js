const fs        = require("fs")
const Graphemer = require("graphemer").default
const clc       = require("cli-color")
const _         = init()

_.mixin({extract2,serverEx2,render,read,parse})

let once = false

_("Bookmarks")
.read()
.parse()
.serverEx2("html")
.value()

function sort_emoji(obj){

	let m   = []
	let max = obj.roots.bookmark_bar.children.length
	let y   = 0
	
	let splitter = new Graphemer()
	let splx = (x) => splitter.splitGraphemes(x).slice(2).join("")

	for( let i=0;i<obj.roots.bookmark_bar.children.length;i++ ){

		if( obj.roots.bookmark_bar.children[i].type == "folder" ){

			let v = obj.roots.bookmark_bar.children[i]
			
			m.push([i,v,splx(v.name)])
			
			delete obj.roots.bookmark_bar.children[i]
		
		}

	}

	m = _.orderBy(m,2,"asc")

	for( let i=0;i<max;i++ ){
		if( obj.roots.bookmark_bar.children[i] == null ){
			obj.roots.bookmark_bar.children[i] = m[y][1]
			y++
		}
	}

	return obj
}

function serverEx2(obj,n){

	const express = require("express")
	const app     = express()
	const PORT    = 8080

	app.use(express.static(__dirname))

	app.get("/", function(req, res) {

		res.writeHead(200,{"content-type":`text/${n};charset=utf8`})

		res.end(render(extract2(obj)))
	})

	app.get("/:id",(req, res) => {

		res.writeHead(200,{"content-type":`text/${n};charset=utf8`})

		if( req.params.id == "print" ){

			res.end("print...")

		} else if ( req.url != "/" && req.url != "/favicon.ico" ){
			
			try {

				Object.prototype.pick = function(...args) { let t = [];for( let k of args ) t.push(this[k]);return t}

				let v = extract2(obj,req.params.id)
				.map( x => x.pick("name","url") )

				delete Object.prototype.pick
				
				res.end( render(v) )

			}catch(e){ res.end(req.params.id) }

		}

	})

	app.listen(PORT)

	console.log(`Running at port ${PORT}`)

}

function extract2(obj,str,type){

	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
	}

	if( str == undefined ){
		
		let table = []
		let splitter = new Graphemer()

		let index = 0

		for ( let x of obj.roots.bookmark_bar.children ){

			if ( x.type == "folder" ){

				index++
				let size = x.children.length
				
				table.push({

					"id"       : index,
					"type"     : x.type.toUpperCase(),
					"fullname" : x.name,
					"name"     : splitter.splitGraphemes(x.name).slice(2).join(""),
					"url"      : `<a href="/${splitter.splitGraphemes(x.name).slice(2).join("")}">${splitter.splitGraphemes(x.name).slice(2).join("")}</a>`,
					"size"     : size,
					"icon"     : splitter.splitGraphemes(x.name)[0],
					"color"    : false
				})

			}
		}

		Array.prototype.pickle2 = function(x){
			let m = []
			for( let v of this ){
				let n = x.map(x=>x.name).indexOf(v)
				if( x[n] !== undefined ) m.push(x[n])
				x.splice(n,1)
			}
			return m
		}

		old_table = [...table]

		table.sort( (a,b) => a.name.localeCompare(b.name) )

		table = [
		...["B","test","test music","to share"].pickle2(table),
		...table,
		...["BIN","SHARE ( JAPAN )","DISCORD","MOUSE SELECTION","ELECTRON"].pickle2(table)
		]

		delete Array.prototype.pickle2

		let p = ( (table,old_table) => {

			let log=(x,n) => console.log(clc[n](x));let p=[]

			if( !once ){
				let space = 0
				for( let i=0;i<old_table.length;i++ ){

					if( table[i] != old_table[i-space] ){
						log(i+" "+table[i]+" "+old_table[i-space],"red");space++;remove(old_table,table[i])
						p.push(i)
					}else{
						log(i+" "+table[i]+" "+old_table[i-space],"green")
					}

				}
				once=!once
			}

			return p

		})(_.map(table,"name"),_.map(old_table,"name"))

		console.log(p)

		for( let k of p ){
			table[k].color = true
		}

		return table
		
	}

	if( str != undefined ){

		if( type == undefined )
		type = "folder"

		let n = 0

		for ( let [i,x] of obj.roots.bookmark_bar.children.entries() ){

			let reg = new RegExp(escapeRegExp(str))

			if( (reg).test(x.name) && x.type == type )
			n = i

		}

		return obj.roots.bookmark_bar.children[n].children
	}
}

function render(m){

	let content = "<style>table{font-family:arial,sans-serif;border-collapse:collapse;}td,th{border:1px solid #dddddd;text-align:left;padding:8px;}</style>"

	content += "<a href=\"/print\"><button>test</button></a><br><br>"

	content += "<table>"

	for ( let [i,x] of m.entries() ){
	
		content += `<tr style="${(x => x ? "opacity:0.5" : "" )(x.color)}">`
			
			content += `<td>${i+1}</td>`
			
			for ( let k in x ){
				content += `<td>${x[k]}</td>`
			}
		
		content += "</tr>"

	}
	
	content += "</table>"
	return content

}

function read(x){
	return fs.readFileSync(x,"utf8")
}

function parse(x){
	return JSON.parse(x)
}

function remove(array,element) {
	const index = array.indexOf(element)
	array.splice(index,1)
}

function init(){
	return require("lodash")
}
