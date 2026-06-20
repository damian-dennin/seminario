document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    sidebarToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('sidebar-expanded');
        document.body.classList.toggle('sidebar-expanded');
    });
});
