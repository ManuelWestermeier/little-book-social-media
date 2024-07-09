import { readFileSync, writeFileSync } from "fs"
import { createServer } from "http"

const uploadPage = readFileSync("pages\\upload.htm", "utf-8")
const stylePage = readFileSync("pages\\style.css", "utf-8")

const firstPage = readFileSync("pages\\index.htm", "utf-8").split("$$$")
const searchPage = readFileSync("pages\\search.html", "utf-8").split("$$$")
const bookPage = readFileSync("pages\\book.html", "utf-8").split("$$$")

const books = JSON.parse(readFileSync("data.json", "utf-8"))

const allowedElemTypes = ["b", "i", "h1", "h2", "h3", "h4", "h5", "h6"]

function appendElements(str = "") {
    var out = str

    allowedElemTypes.forEach(type => {
        out = out.split(`|${type}|`).join(`<${type}>`)
        out = out.split(`|/${type}|`).join(`</${type}>`)
    })

    return out
}

function securify(str = "", elems = false) {
    if (str == null) {
        return ""
    }

    if (elems) {
        return appendElements(
            str.split("<").join("< ")
                .split("\n").join("<br>")
        )
    }

    return str.split("<").join("< ")
        .split("\n").join("<br>")
}

createServer((req, res) => {
    const url = new URL("http://localhost" + req.url)

    if (url.pathname == "/style") {
        res.writeHead(200, { "Content-Type": "text/css" })
        return res.end(stylePage)
    }

    if (url.pathname == "/search") {
        res.writeHead(200, { "Content-Type": "text/html" })
        res.write(searchPage[0])

        const search = (url.searchParams.get("q") + "").toLowerCase()

        if (search.length < 2) {
            res.write("<p>Search have to be bigger than 1 character</p>")
            return res.end(searchPage[1])
        }

        for (let index = 0; index < books.length; index++) {
            if (books[index][0].includes(search)) {
                res.write(`<li>
                    <a href="/book?id=${index}">
                        <span>${books[index][1]}</span>
                        <span>${books[index][3]}</span>
                    </a>    
                </li>`)
            }
        }

        return res.end(searchPage[1])
    }

    if (url.pathname == "/book") {
        const id = parseInt(url.searchParams.get('id') || "0") || 0
        res.write(bookPage[0])
        //name
        res.write(books?.[id]?.[1] || "book not found")
        res.write(bookPage[1])
        //name
        res.write(books?.[id]?.[1] || "book not found")
        res.write(bookPage[2])
        //content
        res.write(books?.[id]?.[2] || "book not found")
        res.write(bookPage[3])
        //meta
        res.write(books?.[id]?.[3] || "book not found")
        return res.end(bookPage[4])
    }

    if (url.pathname == "/") {
        res.writeHead(200, { "Content-Type": "text/html" })

        res.write(firstPage[0])

        try {
            const watched = (req.headers?.cookie || "")
                .split(";")
                .map(v => parseInt(v))
                .filter(v => v < books.length)
                .filter(v => !isNaN(v))

            for (const watchedId in watched) {
                res.write(`<p><a href="/book?id=${watchedId}">${books[watchedId][1]}</a></p>`)
            }
        } catch (error) { }

        return res.end(firstPage[1])
    }

    if (url.pathname == "/upload") {
        if (req.method == "GET")
            return res.end(uploadPage)

        var body = "";

        req.on("data", d => body += d.toString("utf-8"));

        req.on("end", () => {
            const data = new URLSearchParams(body)

            const title = securify(data.get("t") || "")
            const content = securify(data.get("c") || "", true)

            books.push([title.toLocaleLowerCase(), title, content, new Date().toDateString()])

            res.writeHead(200, { "Content-Type": "text/html" })
            res.end(`<script>window.location = '/book?id=${books.length - 1}'</script>`)
        })

        return
    }

    return res.end("404")
}).listen(802)

setInterval(() => {
    writeFileSync("data.json", JSON.stringify(books), "utf-8")
}, 10000)