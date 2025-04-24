const categories = ["Pre-styling", "Pomade", "Grooming"];

categories.forEach(category => {
    
    const documents = db.products.find({ category: category }).toArray();
    
    
    documents.forEach((doc, index) => {
        const formattedIndex = String(index + 1).padStart(2, '0');
        const newImgURL = `/assets/products/${category}/${category}${formattedIndex}.jpg`;

        db.products.updateOne(
            { _id: doc._id },
            { $set: { imgURL: newImgURL } }
        );

        print(`Updated ${doc.name} (${category}): ${newImgURL}`);
    });
});

print("Hoàn tất cập nhật imgURL cho tất cả sản phẩm theo category.");