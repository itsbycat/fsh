const fs = require("fs")

const locations = {
    from: "D:\\Anime", // main target
    to: "G:\\My Drive\\Uploads" // target
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
        else { ret[file] = stats.size }
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

    console.log(`[ ${Object.keys(to).length} / ${Object.keys(from).length} ] ${Object.keys(output).length} ==> ${Object.keys(from).length - Object.keys(to).length}`)
}
main()