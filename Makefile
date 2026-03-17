.PHONY: build-proto clean-proto

PROTO_DIR := ./protobuf
PROTO_OUT_DIR := ./packages/proto/src/generated

# Default to Unix path
PROTOC_PLUGIN := ./node_modules/.bin/protoc-gen-ts_proto

# If Windows (OS environment variable is usually defined on Windows), use .cmd
ifdef OS
   PROTOC_PLUGIN := ./node_modules/.bin/protoc-gen-ts_proto.cmd
endif

build-proto:
	@echo "Building protocol buffers..."
	@mkdir -p $(PROTO_OUT_DIR)
	@protoc \
		--plugin=$(PROTOC_PLUGIN) \
		--ts_proto_out=$(PROTO_OUT_DIR) \
		--ts_proto_opt=esModuleInterop=true \
		--ts_proto_opt=outputServices=grpc-js \
		--ts_proto_opt=env=node \
		--ts_proto_opt=useOptionals=messages \
		--proto_path=. \
		$(PROTO_DIR)/*.proto
	@echo "Protocol buffers built successfully"

clean-proto:
	@echo "Cleaning protocol buffers..."
	@rm -rf $(PROTO_OUT_DIR)
	@echo "Protocol buffers cleaned"
