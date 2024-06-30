// Xử lý hiệu ứng filter-bar
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
        // Remove 'selected' class from all chips
        document.querySelectorAll('.chip').forEach(c => c.removeAttribute('selected'));
        // Add 'selected' class to the clicked chip
        this.setAttribute('selected', '');
    });
});

// Xử lý hiệu ứng header và filter-bar khi cuộn trang
const header = document.querySelector(".header");
const filterBar = document.getElementById('filter-bar');
let lastScrollTop = 0;
const delta = 5;

function handleScroll() {
    const currentScroll = window.pageYOffset;
    const scrollingDown = currentScroll > lastScrollTop;
    if (scrollingDown) {
        header.style.transform = "translateY(-100%)"; // Cuộn xuống
        filterBar.style.transform = "translateY(-200%)"; // Cuộn xuống
    } else {
        header.style.transform = "translateY(0)"; // Cuộn lên
        filterBar.style.transform = "translateY(0)"; // Cuộn lên
    }
    lastScrollTop = currentScroll;
}

window.addEventListener("scroll", handleScroll);

// Sự kiện điều khiển cuộn chuột cho filter-bar
document.getElementById("letter-buttons").addEventListener("wheel", function (event) {
    this.scrollLeft += event.deltaY;
    event.preventDefault();
});

// Sự kiện ẩn hiện filter-bar khi nhấn vào nút filterButton
const filterButton = document.querySelector('.icon:nth-child(2)');
filterButton.addEventListener('click', function() {
    const filterBar = document.getElementById('filter-bar');
    filterBar.style.display = filterBar.style.display === 'block' ? 'none' : 'block';
});

// Sự kiện hiển thị menu khi nhấn vào logo
const logo = document.querySelector('.logo');
const menu = document.getElementById('menu');

logo.addEventListener('click', function() {
    menu.classList.toggle('show');
});

// Sự kiện ẩn menu khi chọn một mục trong menu
const menuItems = document.querySelectorAll('.menu li');

menuItems.forEach(item => {
    item.addEventListener('click', function() {
        menu.classList.remove('show');
    });
});

// Sự kiện hiển thị thanh tìm kiếm khi nhấn vào nút searchButton
const searchButton = document.getElementById('searchButton');
const searchBar = document.getElementById('searchBar');
const closeSearchButton = document.getElementById('closeSearchButton');

searchButton.addEventListener('click', function() {
    searchBar.style.display = 'block';
});

// Sự kiện đóng thanh tìm kiếm khi nhấn vào nút closeSearchButton
closeSearchButton.addEventListener('click', function() {
    searchBar.style.display = 'none';
});
