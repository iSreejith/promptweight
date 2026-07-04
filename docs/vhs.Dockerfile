# Image used to record docs/demo.gif — vhs plus Node for the CLI.
#
#   docker build -t promptweight-vhs -f docs/vhs.Dockerfile .
#   docker run --rm -v "$PWD:/vhs" promptweight-vhs docs/demo.tape
FROM ghcr.io/charmbracelet/vhs
RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*
