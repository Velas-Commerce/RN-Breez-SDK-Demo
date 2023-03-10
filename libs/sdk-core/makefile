PROJECTNAME=$(shell basename "$(PWD)")
SOURCES=$(sort $(wildcard ./src/*.rs ./src/**/*.rs))

SHELL := /bin/bash

.PHONY: help
help: makefile
	@echo
	@echo " Available actions in "$(PROJECTNAME)":"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo

## init: Install missing dependencies.
.PHONY: init
init:
	rustup target add aarch64-apple-ios x86_64-apple-ios
	rustup target add aarch64-apple-darwin x86_64-apple-darwin
	rustup target add aarch64-apple-ios-sim
	rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
	rustup target add aarch64-unknown-linux-gnu armv7-unknown-linux-gnueabi i686-unknown-linux-gnu x86_64-unknown-linux-gnu
	@if [ $$(uname) == "Darwin" ] ; then cargo install cargo-lipo ; fi
	cargo install cbindgen
	cargo install cargo-ndk

## all: Compile iOS, Android
all: ios macos android linux

## ios: Compile the iOS universal library
ios: ios-universal

ios-universal: $(SOURCES) ndk-home
	cargo lipo --release
	@echo "[DONE] $@"

target/x86_64-apple-ios/debug/libbreez-sdk.a: $(SOURCES) ndk-home
	@if [ $$(uname) == "Darwin" ] ; then \
		cargo lipo --targets x86_64-apple-ios; \
		cp target/x86_64-apple-ios/debug/libbreez-sdk.a ../ios/libbreez-sdk.a ; \
		else echo "Skipping iOS compilation on $$(uname)" ; \
	fi
	@echo "[DONE] $@"

target/aarch64-apple-ios-sim/debug/libbreez-sdk.a: $(SOURCES) ndk-home
	@if [ $$(uname) == "Darwin" ] ; then \
		cargo lipo --targets aarch64-apple-ios-sim; \
		cp target/aarch64-apple-ios-sim/debug/libbreez-sdk.a ../ios/libbreez-sdk.a ; \
		else echo "Skipping iOS compilation on $$(uname)" ; \
	fi
	@echo "[DONE] $@"

## macos: Compile the macOS libraries
macos: x86_64-apple-darwin aarch64-apple-darwin

x86_64-apple-darwin: $(SOURCES)
	@if [ $$(uname) == "Darwin" ] ; then \
		cargo lipo --release --targets x86_64-apple-darwin ; \
		else echo "Skipping macOS compilation on $$(uname)" ; \
	fi
	@echo "[DONE] $@"

aarch64-apple-darwin: $(SOURCES)
	@if [ $$(uname) == "Darwin" ] ; then \
		cargo lipo --release --targets aarch64-apple-darwin ; \
		else echo "Skipping macOS compilation on $$(uname)" ; \
	fi
	@echo "[DONE] $@"

## android: Compile the android targets: armv7 arm64 i686 x86_64
android: armv7-linux-androideabi aarch64-linux-android i686-linux-android x86_64-linux-android

armv7-linux-androideabi: $(SOURCES) ndk-home
	cargo ndk -t armv7-linux-androideabi build --release

aarch64-linux-android: $(SOURCES) ndk-home
	cargo ndk -t aarch64-linux-android build --release

i686-linux-android: $(SOURCES) ndk-home
	cargo ndk -t i686-linux-android build --release

x86_64-linux-android: $(SOURCES) ndk-home
	cargo ndk -t x86_64-linux-android build --release

## linux: Compile the linux targets: armv7 arm64 i686 x86_64
linux: armv7-unknown-linux-gnueabi aarch64-unknown-linux-gnu i686-unknown-linux-gnu x86_64-unknown-linux-gnu

armv7-unknown-linux-gnueabi: $(SOURCES)
	cargo build --release --target armv7-unknown-linux-gnueabi

aarch64-unknown-linux-gnu: $(SOURCES)
	cargo build --release --target aarch64-unknown-linux-gnu

i686-unknown-linux-gnu: $(SOURCES)
	cargo build --release --target i686-unknown-linux-gnu

x86_64-unknown-linux-gnu: $(SOURCES)
	cargo build --release --target x86_64-unknown-linux-gnu

.PHONY: ndk-home
ndk-home:
	@if [ ! -d "${ANDROID_NDK_HOME}" ] ; then \
		echo "Error: Please, set the ANDROID_NDK_HOME env variable to point to your NDK folder" ; \
		exit 1 ; \
	fi

## :

# ##############################################################################
# # OTHER
# ##############################################################################

## clean:
.PHONY: clean
clean:
	cargo clean
	rm -f target/bindings.h target/bindings.src.h

## test:
.PHONY: test
test:
	cargo test
