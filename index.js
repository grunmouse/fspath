const myfs = require('fs').promises;
const Path = require('path');


function clearFile(path){
	return myfs.writeFile(path, "");
}

function cloneFile(source, newpath){
	return readFile(source).then((data)=>(writeFile(newpath, data)));
}

function isENOENT(callback){
	return function(err){
		if(err.code=='ENOENT'){
			return callback();
		}
		else{
			throw err;
		}
	};
}

function createFolder(folder){
	return myfs.stat(folder).catch(isENOENT(()=>(myfs.mkdir(folder))));
}

async function createPath(path){
	let folder = path.split(Path.sep);
	let i = Path.isAbsolute(path) ? 1 : 0;
	//console.log(folder);
	for(; i < folder.length; ++i){
		//console.log(i, folder[i]);
		if(!['.','..',''].includes(folder[i])){
			let name = folder.slice(0, i+1).join(Path.sep);
			//console.log(name);
			if(name!=''){
				await createFolder(name);
			}
		}
	}
}

//path, size, mtime
function getFileList(folder){
	function doScanFolder(folderpath){
		return fsp.readdir(folderpath).then(function(filelist){
			return Promise.all(filelist.map(function(filename){
				var filepath = Path.join(folderpath, filename);
				return fsp.lstat(filepath).then((stat)=>{
					if(stat.isDirectory()){
						return doScanFolder(filepath);
					}
					else if(stat.isFile()){
						return [[Path.relative(folder, filepath), stat.size, stat.mtime.valueOf()]];
					}
				});
			})).then((data)=>(concat.apply([], data).sort((a, b)=>(+(a[0]>b[0])-(a[0]<b[0])))));
		});
	}
	return doScanFolder(folder);
}


function intoPathWrapper(func){
	return async function(...args){
		let path = args[0];
		let filename = Path.basename(path);
		let folder = Path.dirname(path);//.split(Path.sep);
		//console.log(folder);
		await createPath(folder);
		return func(...args);
	};
}

const intoPath = {};

[
	'writeFile'
].forEach((key)=>{intoPath[key] = intoPathWrapper(myfs[key])});

module.exports = {
	isENOENT,
	createFolder,
	createPath,
	intoPath,
	
	getFileList
};