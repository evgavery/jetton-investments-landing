document.addEventListener("DOMContentLoaded", () => {
    const faqItems = document.querySelectorAll(".faq-item")

    faqItems.forEach(item => {
        item.addEventListener("click", (e) => {
            faqItems.forEach(item => {
                if (item !== e.currentTarget) {
                    item.classList.contains("active") && item.classList.remove("active")
                }
            })
            e.currentTarget.classList.toggle('active')
        })
    })

})