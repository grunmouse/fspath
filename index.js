const fsp = require('fs').promises;
const Path = require('path');


function clearFile(path){
	return fsp.writeFile(path, "");
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
	return fsp.stat(folder).catch(isENOENT(()=>(fsp.mkdir(folder))));
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

const concat = Array.prototype.concat;

//путь, размер, дата доступа, дата создания
//path, size, mtime, birthtime
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
						return [[Path.relative(folder, filepath), stat.size, stat.mtime.valueOf(), stat.birthtime.valueOf()]];
					}
				});
			})).then((data)=>(concat.apply([], data).sort((a, b)=>(+(a[0]>b[0])-(a[0]<b[0])))));
		});
	}
	return doScanFolder(folder);
}

function intoPathWrapper(func){
	return function(...args){
		let path = args[0];
		//let filename = Path.basename(path);
		let folder = Path.dirname(path);//.split(Path.sep);
		//console.log(folder);
		return createPath(folder).then(()=>(func(...args)));
	};
}

function safeStat(path){
	return fsp.stat(path).catch(isENOENT(()=>(false)));
}

function copyFile(src, dest, mode){
	let path = dest;
	//let filename = Path.basename(path);
	let folder = Path.dirname(path);
	
	return createPath(folder).then(()=>(fsp.copyFile(src, dest, mode)));
}

const intoPath = {
	copyFile
};

[
	'writeFile'
].forEach((key)=>{intoPath[key] = intoPathWrapper(fsp[key])});

module.exports = {
	isENOENT,
	safeStat,
	createFolder,
	createPath,
	intoPath,
	
	getFileList
};