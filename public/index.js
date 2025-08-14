window.addEventListener("load", () =>{
    const postData = async () =>{
        try {
            const data = await axios.post("/temp")
            console.log(data)
        } catch (error) {
            console.log(error)
        }
    }
    postData()
})