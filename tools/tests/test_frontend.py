"""Static checks of the TypeScript/Vue frontend that no linter covers."""

from __future__ import annotations

import pathlib
import re

import pytest

PROJECT_DIR = pathlib.Path(__file__).resolve().parents[2]
SRC_DIR = PROJECT_DIR / "src"
HTML_PAGES = ("index.html", "impressum.html", "datenschutz.html")


def script_sources() -> list[tuple[pathlib.Path, list[str]]]:
    """Collect the script lines of every .ts file and every .vue <script> block.

    Returns:
        Pairs of file path and its script lines (.d.ts files are skipped).
    """
    sources: list[tuple[pathlib.Path, list[str]]] = []
    for path in sorted(SRC_DIR.rglob("*.ts")):
        if not path.name.endswith(".d.ts"):
            sources.append((path, path.read_text(encoding="utf-8").splitlines()))
    for path in sorted(SRC_DIR.rglob("*.vue")):
        text = path.read_text(encoding="utf-8")
        match = re.search(r"<script[^>]*>(.*?)</script>", text, re.DOTALL)
        if match:
            sources.append((path, match.group(1).splitlines()))
    return sources


def undocumented(lines: list[str]) -> list[str]:
    """Find functions, classes and class methods without a preceding /** */ block.

    Args:
        lines: Script lines of one file.

    Returns:
        The offending declaration lines.
    """
    function_re = re.compile(r"^\s*(export\s+)?(async\s+)?function\s+\w+")
    class_re = re.compile(r"^\s*(export\s+)?class\s+\w+")
    # Methoden: genau zwei Leerzeichen Einrückung innerhalb einer Klasse, Signatur endet mit {
    method_re = re.compile(r"^  (?:(?:private|public|static|async)\s+)*[A-Za-z_]\w*\(.*\)[^=]*\{$")
    missing: list[str] = []
    in_class = False
    for i, line in enumerate(lines):
        if class_re.match(line):
            in_class = True
        elif line.startswith("}"):
            in_class = False
        is_decl = bool(function_re.match(line) or class_re.match(line))
        is_method = in_class and bool(method_re.match(line)) and "=>" not in line
        if (is_decl or is_method) and not (i > 0 and lines[i - 1].strip().endswith("*/")):
            missing.append(line.strip())
    return missing


class TestJsDoc:
    """Every function, class and method in the frontend has a JSDoc block."""

    @pytest.mark.parametrize(
        ("path", "lines"), script_sources(), ids=lambda v: getattr(v, "name", "")
    )
    def test_declarations_have_jsdoc(self, path: pathlib.Path, lines: list[str]) -> None:
        """Each declaration is directly preceded by a /** ... */ block."""
        assert undocumented(lines) == [], f"{path.name}: missing JSDoc"

    def test_detector_flags_missing_block(self) -> None:
        """A function without a JSDoc block is reported."""
        assert undocumented(["// note", "function foo(): void {"]) == ["function foo(): void {"]


class TestNoThirdPartyResources:
    """The app loads nothing from third-party servers (no IP transfer to CDNs)."""

    URL_RE = re.compile(r"https?://")

    @pytest.mark.parametrize(
        ("path", "lines"), script_sources(), ids=lambda v: getattr(v, "name", "")
    )
    def test_scripts_contain_no_urls(self, path: pathlib.Path, lines: list[str]) -> None:
        """Scripts contain no absolute URLs that could be fetched."""
        hits = [line.strip() for line in lines if self.URL_RE.search(line)]
        assert hits == [], f"{path.name}: {hits}"

    @pytest.mark.parametrize("page", HTML_PAGES)
    def test_html_loads_only_local_resources(self, page: str) -> None:
        """HTML pages reference external URLs only in plain <a> links."""
        text = (PROJECT_DIR / page).read_text(encoding="utf-8")
        external = re.findall(r"<(?!a\s)\w+[^>]*(?:src|href)=\"https?://", text)
        assert external == []


class TestLegalPages:
    """Imprint and privacy policy are reachable from the app."""

    @pytest.mark.parametrize("page", ["/impressum.html", "/datenschutz.html"])
    def test_footer_links_legal_page(self, page: str) -> None:
        """The always-visible footer in App.vue links the page."""
        assert f'href="{page}"' in (SRC_DIR / "App.vue").read_text(encoding="utf-8")

    @pytest.mark.parametrize("page", ["/impressum.html", "/datenschutz.html"])
    def test_onboarding_links_legal_page(self, page: str) -> None:
        """The full-screen onboarding overlay links the page as well."""
        onboarding = SRC_DIR / "components" / "OnboardingScreen.vue"
        assert f'href="{page}"' in onboarding.read_text(encoding="utf-8")

    @pytest.mark.parametrize("page", ["impressum", "datenschutz"])
    def test_page_is_build_entry(self, page: str) -> None:
        """The page is a Vite build entry, so it ends up in dist/."""
        config = (PROJECT_DIR / "vite.config.ts").read_text(encoding="utf-8")
        assert f"'{page}.html'" in config
