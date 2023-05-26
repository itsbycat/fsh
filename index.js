const fs = require("fs")
const path = require("path")

const locations = {
    from: "D:\\Anime", // main target
    to: "G:\\My Drive\\Uploads" // target
}

async function getFS(folderPath) {
    let totalSize = 0;
  
    function traverseDirectory(directory) {
        const files = fs.readdirSync(directory)
  
        files.forEach(file => {
            const filePath = path.join(directory, file)
            const stats = fs.statSync(filePath)
  
            if (stats.isFile()) {
                totalSize += stats.size
            } else if (stats.isDirectory()) {
                traverseDirectory(filePath)
            }
        })
    }
  
    traverseDirectory(folderPath)
  
    return totalSize
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function readDir(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) { reject(err); return }
            resolve(files)
        })
    })
}

async function buildFT(dir) {
    const files = await readDir(dir)
    const ret = {}
    for (const file of files) {
        const filePath = `${dir}/${file}`
        const stats = fs.lstatSync(filePath)
        if (stats.isDirectory()) { ret[file] = await buildFT(filePath) }
        else { ret[file] = formatBytes(stats.size) }
    }
    return ret
}

function findMissingElements(objA, objB, result = {}) {
    for (let key in objA) {
        if (!objB.hasOwnProperty(key)) {
            result[key] = objA[key]
        } else if (typeof objA[key] === 'object' && typeof objB[key] === 'object') {
            const nestedResult = findMissingElements(objA[key], objB[key])
            if (Object.keys(nestedResult).length > 0) {
                result[key] = nestedResult
            }
        } else if (Array.isArray(objA[key]) && Array.isArray(objB[key])) {
            const diffArray = objA[key].filter(item => !objB[key].includes(item))
            if (diffArray.length > 0) {
                result[key] = diffArray
            }
        }
    }
    return result
}

async function main() {
    const from = await buildFT(locations.from)
    const to = await buildFT(locations.to)
    const output = await findMissingElements(from, to)
    fs.writeFileSync("./from.txt", JSON.stringify(from, null, 2))
    fs.writeFileSync("./to.txt", JSON.stringify(to, null, 2))
    fs.writeFileSync("./output.txt", JSON.stringify(output, null, 2))

    const from_size = await getFS(locations.from)
    const to_size = await getFS(locations.to)
    const output_size = await formatBytes(from_size - to_size)

    const logtext = `
    [ ${Object.keys(to).length} / ${Object.keys(from).length} ] ${Object.keys(output).length} ==> ${Object.keys(from).length - Object.keys(to).length} file left

    [ ${formatBytes(to_size)} / ${formatBytes(from_size)} ] ${output_size} left`

    fs.writeFileSync("./log.txt", logtext)

    console.log(logtext)
}
main()